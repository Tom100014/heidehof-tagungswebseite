
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { blogPostId, images, blogTitle } = await req.json()

    if (!blogPostId || !images || !Array.isArray(images)) {
      throw new Error('Missing required fields: blogPostId, images')
    }

    console.log('🎯 FIXED: Enhanced save-blog-images function called:', {
      blogPostId,
      blogTitle,
      imageCount: images.length,
      categories: images.map(img => img.category)
    })

    // Validate blog post exists
    const { data: blogPost, error: blogError } = await supabaseClient
      .from('blog_posts')
      .select('id, title')
      .eq('id', blogPostId)
      .single()

    if (blogError || !blogPost) {
      throw new Error(`Blog post not found: ${blogPostId}`)
    }

    console.log('✅ FIXED: Blog post validated:', blogPost.title)

    // Save each image using the enhanced database function
    const savedImages = []
    
    for (const image of images) {
      const { url, category, title, altText } = image
      
      console.log('💾 FIXED: Saving image with enhanced function:', {
        category,
        title: title?.substring(0, 50) + '...',
        url: url?.substring(0, 100) + '...'
      })

      const { data: imageId, error: saveError } = await supabaseClient
        .rpc('save_manager_image_to_post', {
          p_blog_post_id: blogPostId,
          p_image_url: url,
          p_image_category: category,
          p_title: title || `${blogTitle} - ${category}`,
          p_alt_text: altText || `Blog image for ${blogTitle}`
        })

      if (saveError) {
        console.error('❌ FIXED: Error saving image:', saveError)
        throw saveError
      }

      console.log('✅ FIXED: Image saved with ID:', imageId)
      savedImages.push({
        id: imageId,
        category,
        url,
        title
      })
    }

    console.log('🎉 FIXED: All images saved successfully:', {
      totalSaved: savedImages.length,
      blogTitle,
      categories: savedImages.map(img => img.category)
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `${savedImages.length} images saved successfully to database`,
        savedImages,
        blogPost: blogPost.title
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ FIXED: Error in save-blog-images function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Enhanced save-blog-images function failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
