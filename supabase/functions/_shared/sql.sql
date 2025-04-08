
-- Create a database function to execute safe queries
CREATE OR REPLACE FUNCTION public.execute_query(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with permissions of the user who created the function
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Add validation to only allow SELECT statements
  IF NOT query_text ~* '^SELECT' THEN
    RAISE EXCEPTION 'Only SELECT statements are allowed';
  END IF;
  
  EXECUTE 'SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (' || query_text || ') t' INTO result;
  RETURN result;
END;
$$;

-- Set permissions to allow calling this function
GRANT EXECUTE ON FUNCTION public.execute_query TO anon, authenticated, service_role;
