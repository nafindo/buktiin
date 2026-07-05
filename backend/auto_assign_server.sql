-- Fungsi untuk secara otomatis memberikan server (node) kepada user baru berdasarkan sisa kapasitas server
CREATE OR REPLACE FUNCTION public.assign_user_to_server()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_storage_mb INTEGER;
  v_target_node_id UUID;
BEGIN
  -- Dapatkan limit storage (dalam MB) dari plan yang dipilih user
  SELECT storagelimit INTO v_plan_storage_mb FROM public.plans WHERE id = NEW.plan_id;
  
  -- Cek apakah user sudah memiliki server (sudah ter-assign sebelumnya)
  IF EXISTS (SELECT 1 FROM public.user_servers WHERE user_id = NEW.user_id) THEN
    RETURN NEW; -- Jika sudah punya server, lewati agar tidak dobel
  END IF;

  -- Cari server aktif yang sisa kapasitasnya masih cukup untuk menampung kebutuhan plan baru
  -- Sisa kapasitas = (max_capacity_gb * 1024) - total_allocated_mb
  SELECT n.id INTO v_target_node_id
  FROM public.storage_nodes n
  LEFT JOIN public.user_servers us ON n.id = us.node_id
  LEFT JOIN public.subscriptions s ON us.user_id = s.user_id AND s.status = 'ACTIVE'
  LEFT JOIN public.plans p ON s.plan_id = p.id
  WHERE n.status = 'ACTIVE'
  GROUP BY n.id, n.max_capacity_gb
  HAVING (n.max_capacity_gb * 1024) - COALESCE(SUM(p.storagelimit), 0) >= v_plan_storage_mb
  ORDER BY COALESCE(SUM(p.storagelimit), 0) ASC -- Prioritaskan server yang paling kosong
  LIMIT 1;

  -- Jika server yang memadai ditemukan, masukkan data ke tabel user_servers
  IF v_target_node_id IS NOT NULL THEN
    INSERT INTO public.user_servers (user_id, node_id) VALUES (NEW.user_id, v_target_node_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hapus trigger jika sudah pernah dibuat sebelumnya agar tidak bentrok
DROP TRIGGER IF EXISTS trigger_assign_user_to_server ON public.subscriptions;

-- Buat trigger yang akan berjalan setiap kali ada record baru di tabel subscriptions
CREATE TRIGGER trigger_assign_user_to_server
AFTER INSERT ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.assign_user_to_server();
