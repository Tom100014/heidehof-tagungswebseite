
-- Create a storage bucket for hotel media if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('hotel-media', 'Hotel Media Storage', true)
    ON CONFLICT DO NOTHING;
    
    -- Create a policy to allow public access to view files
    INSERT INTO storage.policies (name, definition, bucket_id, action)
    VALUES ('Public Access', '(bucket_id = ''hotel-media''::text)', 'hotel-media', 'SELECT')
    ON CONFLICT DO NOTHING;
    
    -- Create a policy to allow uploads
    INSERT INTO storage.policies (name, definition, bucket_id, action)
    VALUES ('Upload Access', '(bucket_id = ''hotel-media''::text)', 'hotel-media', 'INSERT')
    ON CONFLICT DO NOTHING;
    
    -- Create a policy to allow updates
    INSERT INTO storage.policies (name, definition, bucket_id, action)
    VALUES ('Update Access', '(bucket_id = ''hotel-media''::text)', 'hotel-media', 'UPDATE')
    ON CONFLICT DO NOTHING;
    
    -- Create a policy to allow deletes
    INSERT INTO storage.policies (name, definition, bucket_id, action)
    VALUES ('Delete Access', '(bucket_id = ''hotel-media''::text)', 'hotel-media', 'DELETE')
    ON CONFLICT DO NOTHING;
END
$$;
