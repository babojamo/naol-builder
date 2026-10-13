-- Restore previously discarded metadata from the authoritative raw cache; no API resync required.
update public.flyff_entities set normalized_payload=normalized_payload || jsonb_strip_nulls(jsonb_build_object(
 'treePosition',raw_payload->'treePosition','requirements',raw_payload->'requirements',
 'skillPoints',raw_payload->'skillPoints','masterVariations',raw_payload->'masterVariations'
)) where resource='skill' and generation_id=(select active_generation from public.flyff_sync_state where id=1);
