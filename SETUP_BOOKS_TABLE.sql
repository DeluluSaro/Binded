-- Create the books table
CREATE TABLE public.books (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  author character varying(255) NOT NULL,
  genre character varying(100) NOT NULL,
  file_path text NULL,
  short_description text NOT NULL,
  cover_image_path text NULL,
  total_pages integer NOT NULL,
  rating numeric(3, 2) NULL DEFAULT 0.00,
  reviews jsonb NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT books_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Enable RLS on the books table
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Create a simple policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations on books" ON public.books
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Insert some sample books with cover images
INSERT INTO public.books (name, author, genre, file_path, short_description, cover_image_path, total_pages, rating) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', 'Fiction', 'the-great-gatsby.epub', 'A classic American novel about the Jazz Age and the American Dream.', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=400&fit=crop', 180, 4.2),
('To Kill a Mockingbird', 'Harper Lee', 'Fiction', 'to-kill-a-mockingbird.epub', 'A gripping tale of racial injustice and childhood innocence in the American South.', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop', 281, 4.5),
('1984', 'George Orwell', 'Dystopian Fiction', '1984.epub', 'A dystopian social science fiction novel about totalitarian control.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop', 328, 4.3),
('Pride and Prejudice', 'Jane Austen', 'Romance', 'pride-and-prejudice.epub', 'A romantic novel about Elizabeth Bennet and Mr. Darcy.', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=400&fit=crop', 432, 4.4),
('The Catcher in the Rye', 'J.D. Salinger', 'Fiction', 'catcher-in-the-rye.epub', 'A coming-of-age story about teenage rebellion and alienation.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop', 277, 3.8),
('Lord of the Flies', 'William Golding', 'Fiction', 'lord-of-the-flies.epub', 'A story about British boys stranded on an uninhabited island.', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop', 224, 4.1);

-- Verify the data was inserted
SELECT id, name, author, genre, cover_image_path, rating FROM public.books ORDER BY created_at DESC;
