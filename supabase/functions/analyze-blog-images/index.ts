
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { blogPostId, templateId } = await req.json();

    if (!blogPostId) {
      return new Response(
        JSON.stringify({ error: 'Missing blogPostId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Analyzing blog images for:', blogPostId);

    // Get blog post data
    const { data: blogPost, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', blogPostId)
      .single();

    if (blogError || !blogPost) {
      console.error('❌ Blog post not found:', blogError);
      return new Response(
        JSON.stringify({ error: 'Blog post not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze content structure
    let sectionsCount = 0;
    let wordCount = 0;
    let heroRequired = 1;
    let contentRequired = 1;

    if (blogPost.structured_content) {
      // Structured content analysis
      const sections = blogPost.structured_content.sections || [];
      sectionsCount = sections.length;
      
      // Calculate content images based on sections
      contentRequired = Math.max(1, sectionsCount);
      
      // Extra images for long articles
      if (sectionsCount > 3) {
        contentRequired = sectionsCount;
      }
      
      // Word count from sections
      wordCount = sections.reduce((acc: number, section: any) => {
        return acc + (section.content?.split(' ').length || 0);
      }, 0);
      
    } else {
      // Legacy content analysis
      wordCount = blogPost.content ? blogPost.content.split(' ').length : 0;
      
      // 1 content image per 300 words, min 1, max 4
      contentRequired = Math.max(1, Math.min(4, Math.floor(wordCount / 300)));
    }

    // Template-specific adjustments
    const templateAdjustments = {
      'luxury': { heroMultiplier: 1, contentMultiplier: 1.5 },
      'magazine': { heroMultiplier: 1, contentMultiplier: 2 },
      'minimal': { heroMultiplier: 1, contentMultiplier: 0.7 },
      'corporate': { heroMultiplier: 1, contentMultiplier: 1.2 },
    };

    const templateConfig = templateAdjustments[templateId as keyof typeof templateAdjustments];
    if (templateConfig) {
      contentRequired = Math.round(contentRequired * templateConfig.contentMultiplier);
    }

    // Check current images
    const currentHeroImages = blogPost.template_images?.hero ? 1 : 0;
    const currentContentImages = Object.keys(blogPost.template_images || {})
      .filter(key => key.startsWith('content')).length;

    // Get manager images count
    const { data: managerImages } = await supabase
      .from('blog_images')
      .select('image_category')
      .eq('blog_post_id', blogPostId)
      .eq('manager_generated', true)
      .eq('is_active', true);

    const managerHeroCount = managerImages?.filter(img => img.image_category === 'hero').length || 0;
    const managerContentCount = managerImages?.filter(img => img.image_category?.startsWith('content')).length || 0;

    const totalHeroImages = Math.max(currentHeroImages, managerHeroCount);
    const totalContentImages = Math.max(currentContentImages, managerContentCount);

    const analysis = {
      blogId: blogPostId,
      title: blogPost.title,
      templateId: templateId || blogPost.template_id || 'default',
      hasStructuredContent: !!blogPost.structured_content,
      sectionsCount,
      wordCount,
      requirements: {
        hero: heroRequired,
        content: contentRequired,
        total: heroRequired + contentRequired
      },
      currentImages: {
        hero: totalHeroImages,
        content: totalContentImages,
        total: totalHeroImages + totalContentImages
      },
      missing: {
        hero: Math.max(0, heroRequired - totalHeroImages),
        content: Math.max(0, contentRequired - totalContentImages)
      },
      progress: {
        percentage: Math.round(((totalHeroImages + totalContentImages) / (heroRequired + contentRequired)) * 100)
      },
      recommendations: []
    };

    // Generate recommendations
    if (analysis.missing.hero > 0) {
      analysis.recommendations.push(`Fügen Sie ${analysis.missing.hero} Hero-Bild hinzu`);
    }
    
    if (analysis.missing.content > 0) {
      analysis.recommendations.push(`Fügen Sie ${analysis.missing.content} Content-Bild(er) hinzu`);
    }
    
    if (sectionsCount > 3) {
      analysis.recommendations.push(`Umfangreicher Artikel (${sectionsCount} Abschnitte) - mehr Bilder empfohlen`);
    }
    
    if (wordCount > 1500) {
      analysis.recommendations.push(`Langer Artikel (${wordCount} Wörter) - zusätzliche Bilder verbessern Lesbarkeit`);
    }

    console.log('✅ Blog image analysis completed:', {
      blogId: blogPostId,
      requirements: analysis.requirements,
      current: analysis.currentImages,
      missing: analysis.missing,
      progress: analysis.progress.percentage + '%'
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in analyze-blog-images:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
