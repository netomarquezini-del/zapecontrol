-- Migration: Create deliveries table
-- Epic 4: Pedidos vs Produção

CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deliveries_order_item_id ON deliveries(order_item_id);
CREATE INDEX idx_deliveries_delivery_date ON deliveries(delivery_date DESC);
CREATE INDEX idx_deliveries_created_by ON deliveries(created_by);

-- View: order items with delivery progress (used by dashboard)
CREATE OR REPLACE VIEW order_items_progress AS
SELECT
  oi.id AS order_item_id,
  oi.order_id,
  oi.product_id,
  oi.quantity AS quantity_ordered,
  COALESCE(SUM(d.quantity), 0) AS quantity_delivered,
  oi.quantity - COALESCE(SUM(d.quantity), 0) AS quantity_remaining,
  CASE
    WHEN oi.quantity = 0 THEN 0
    ELSE ROUND((COALESCE(SUM(d.quantity), 0)::DECIMAL / oi.quantity) * 100, 1)
  END AS progress_percent,
  oi.priority,
  p.name AS product_name,
  p.sku AS product_sku,
  p.photo_url AS product_photo,
  o.code AS order_code,
  o.status AS order_status,
  o.created_at AS order_date
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN products p ON p.id = oi.product_id
LEFT JOIN deliveries d ON d.order_item_id = oi.id
GROUP BY oi.id, oi.order_id, oi.product_id, oi.quantity, oi.priority, oi.created_at,
         p.name, p.sku, p.photo_url, o.code, o.status, o.created_at;

-- Function to auto-update order status based on deliveries
CREATE OR REPLACE FUNCTION update_order_status()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_total_items INTEGER;
  v_completed_items INTEGER;
BEGIN
  -- Get order_id from the order_item
  SELECT oi.order_id INTO v_order_id
  FROM order_items oi
  WHERE oi.id = COALESCE(NEW.order_item_id, OLD.order_item_id);

  -- Count total items and completed items
  SELECT COUNT(*), COUNT(*) FILTER (
    WHERE oi.quantity <= COALESCE((
      SELECT SUM(d.quantity) FROM deliveries d WHERE d.order_item_id = oi.id
    ), 0)
  )
  INTO v_total_items, v_completed_items
  FROM order_items oi
  WHERE oi.order_id = v_order_id;

  -- Update order status
  UPDATE orders SET
    status = CASE
      WHEN v_completed_items = v_total_items THEN 'concluido'
      WHEN v_completed_items > 0 OR EXISTS (
        SELECT 1 FROM deliveries d
        JOIN order_items oi ON oi.id = d.order_item_id
        WHERE oi.order_id = v_order_id
      ) THEN 'parcial'
      ELSE 'aberto'
    END,
    updated_at = NOW()
  WHERE id = v_order_id AND status != 'cancelado';

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_order_status
  AFTER INSERT OR UPDATE OR DELETE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status();
