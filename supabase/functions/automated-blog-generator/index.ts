import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============= ENHANCED SEO ENGINE INTEGRATION =============

// Advanced SEO scoring function
const calculateAdvancedSeoScore = (content: string, topic: string, keywords: string, metaTitle?: string, metaDescription?: string) => {
  let score = 0;
  const recommendations = [];
  const keywordList = keywords.toLowerCase().split(',').map(k => k.trim());
  const contentLower = content.toLowerCase();
  
  // 1. Keyword Density Analysis (15 points)
  const totalWords = content.split(/\s+/).length;
  let totalKeywordOccurrences = 0;
  
  keywordList.forEach(keyword => {
    const occurrences = (contentLower.match(new RegExp(`\\b${keyword}\\b`, 'g')) || []).length;
    totalKeywordOccurrences += occurrences;
  });
  
  const keywordDensity = (totalKeywordOccurrences / totalWords) * 100;
  
  if (keywordDensity >= 1 && keywordDensity <= 2.5) {
    score += 15;
  } else if (keywordDensity < 1) {
    score += 8;
    recommendations.push("Keyword-Dichte zu niedrig");
  } else {
    score += 5;
    recommendations.push("Keyword-Dichte zu hoch");
  }

  // 2. Heading Structure Analysis (15 points)
  const h1Count = (content.match(/^# /gm) || []).length;
  const h2Count = (content.match(/^## /gm) || []).length;
  const h3Count = (content.match(/^### /gm) || []).length;

  if (h1Count === 1) score += 5;
  if (h2Count >= 3) score += 5;
  if (h3Count >= 2) score += 5;

  // 3. Content Length (10 points)
  if (totalWords >= 800 && totalWords <= 2000) {
    score += 10;
  } else if (totalWords >= 500) {
    score += 7;
  } else {
    score += 3;
  }

  // 4. Internal Linking (10 points)
  const internalLinks = content.match(/\[([^\]]+)\]\(\/[^)]+\)/g) || [];
  score += Math.min(10, internalLinks.length * 2);

  // 5. Meta Tags Optimization (15 points)
  if (metaTitle && metaTitle.length >= 50 && metaTitle.length <= 60) {
    score += 8;
  } else if (metaTitle && metaTitle.length <= 70) {
    score += 5;
  }

  if (metaDescription && metaDescription.length >= 150 && metaDescription.length <= 160) {
    score += 7;
  } else if (metaDescription && metaDescription.length <= 170) {
    score += 4;
  }

  // 6. Call-to-Action Presence (5 points)
  const ctaPatterns = [/jetzt buchen/gi, /jetzt reservieren/gi, /unverbindlich anfragen/gi, /kontaktieren sie uns/gi, /buchen sie heute/gi];
  const hasCTA = ctaPatterns.some(pattern => pattern.test(content));
  if (hasCTA) score += 5;

  // 7. Featured Snippet Optimization (10 points)
  const snippetPatterns = [/^\d+\.\s/gm, /^-\s/gm, /\*\*(.*?)\*\*/g];
  const hasSnippetOptimization = snippetPatterns.some(pattern => pattern.test(content));
  if (hasSnippetOptimization) score += 10; else score += 3;

  // 8. Local SEO Elements (10 points)
  const localKeywords = ['ingolstadt', 'bayern', 'geimersheim', 'donau', 'audi'];
  const localSeoPresent = localKeywords.some(keyword => contentLower.includes(keyword));
  if (localSeoPresent) score += 10; else score += 2;

  return {
    score: Math.min(100, score),
    keywordDensity: Math.round(keywordDensity * 100) / 100,
    recommendations,
    totalWords,
    internalLinksCount: internalLinks.length,
    hasLocalSeo: localSeoPresent,
    hasCTA,
    hasSnippetOptimization
  };
};

// Generate LSI Keywords
const generateLSIKeywords = (primaryKeyword: string, topic: string) => {
  const hotelLSIMap = {
    'wellness': ['entspannung', 'spa', 'massage', 'sauna', 'erholung'],
    'hotel': ['übernachtung', 'zimmer', 'suite', 'unterkunft', 'aufenthalt'],
    'restaurant': ['kulinarik', 'gourmet', 'küche', 'dining', 'gastronomie'],
    'tagung': ['konferenz', 'meeting', 'veranstaltung', 'event', 'business'],
    'urlaub': ['reisen', 'ferien', 'auszeit', 'erholung', 'kurzurlaub'],
    'bayern': ['oberbayern', 'ingolstadt', 'münchen', 'regional', 'tradition']
  };

  const lsiKeywords = [];
  const primaryLower = primaryKeyword.toLowerCase();

  Object.entries(hotelLSIMap).forEach(([category, keywords]) => {
    if (primaryLower.includes(category) || topic.toLowerCase().includes(category)) {
      lsiKeywords.push(...keywords);
    }
  });

  // Always add hotel-specific LSI keywords
  lsiKeywords.push('hotel der heidehof', 'geimersheim', 'ingolstadt hotel', 'donau region');

  return [...new Set(lsiKeywords)].slice(0, 10);
};

// Enhanced Meta Tags Generation
const generateEnhancedMetaTags = (content: string, topic: string, keywords: string) => {
  const firstParagraph = content
    .replace(/^#.*$/gm, '')
    .replace(/\n+/g, ' ')
    .trim()
    .substring(0, 155);

  const metaTitle = `${topic} | Hotel Der Heidehof Ingolstadt`.substring(0, 60);
  const metaDescription = `${firstParagraph}... ✨ Jetzt buchen!`.substring(0, 160);

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": topic,
    "description": metaDescription,
    "author": {
      "@type": "Organization", 
      "name": "Hotel Der Heidehof"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Hotel Der Heidehof"
    },
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString()
  };

  return {
    metaTitle,
    metaDescription,
    keywords: keywords.split(',').map(k => k.trim()),
    schemaOrg
  };
};

// Intelligent Internal Links
const generateIntelligentInternalLinks = (content: string, topic: string) => {
  const internalLinkMap = [
    { keywords: ['wellness', 'spa', 'massage'], text: 'Wellness & Spa Angebote', url: '/wellness' },
    { keywords: ['restaurant', 'kulinarik', 'essen'], text: 'Restaurant Highlights', url: '/restaurant' },
    { keywords: ['zimmer', 'suite', 'übernachtung'], text: 'Zimmer & Suiten', url: '/zimmer' },
    { keywords: ['tagung', 'konferenz', 'meeting'], text: 'Tagungsräume', url: '/tagungen' },
    { keywords: ['ingolstadt', 'audi'], text: 'Audi Museum Ingolstadt', url: '/blog/audi-museum' }
  ];

  const contentLower = content.toLowerCase();
  const suggestedLinks = [];

  internalLinkMap.forEach(link => {
    const hasRelevantKeywords = link.keywords.some(keyword => contentLower.includes(keyword));
    if (hasRelevantKeywords) {
      suggestedLinks.push(link);
    }
  });

  return suggestedLinks.slice(0, 3);
};

// Generate Seasonal Topics
const generateSeasonalTopics = () => {
  const currentMonth = new Date().getMonth();
  const seasonalTopics = {
    spring: ['Frühlingserwachen im Hotel', 'Wellness im Frühling', 'Ostern feiern'],
    summer: ['Sommerferien im Hotel', 'Grillabende auf der Terrasse', 'Radtouren um Ingolstadt'],
    autumn: ['Herbstgemütlichkeit', 'Tagungen im Herbst', 'Kulinarische Herbstspezialitäten'],
    winter: ['Wellness im Winter', 'Weihnachtsfeiern', 'Neujahr im Hotel']
  };

  if (currentMonth >= 2 && currentMonth <= 4) return seasonalTopics.spring;
  if (currentMonth >= 5 && currentMonth <= 7) return seasonalTopics.summer;
  if (currentMonth >= 8 && currentMonth <= 10) return seasonalTopics.autumn;
  return seasonalTopics.winter;
};

interface AutomationSchedule {
  id: string;
  schedule_name: string;
  is_active: boolean;
  blogs_per_day: number;
  execution_times: string[];
  topics_pool: string[];
  ai_provider: string;
  content_type: string;
  tone: string;
  word_count: number;
  enable_hero_images: boolean;
  image_style: string;
  settings: any;
}

interface CTAButton {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  isActive: boolean;
  imageUrl?: string;
  priority: string;
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

    const { schedule_id, trigger_type = 'cron', execution_context = 'automated', instant_config = null, topic = null } = await req.json()

    // Handle instant generation first
    if (trigger_type === 'instant' && instant_config && topic) {
      console.log('⚡ INSTANT: Processing instant blog generation for topic:', topic);
      
      try {
        const result = await generateInstantBlog(topic, instant_config, supabaseClient)
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('❌ INSTANT: Error in instant generation:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Instant generation failed: ' + error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('🤖 AUTOMATION: Starting automated blog generation:', {
      schedule_id,
      trigger_type,
      execution_context,
      timestamp: new Date().toISOString()
    })

    // Get schedule configuration
    let schedule: AutomationSchedule;
    
    if (schedule_id) {
      const { data: scheduleData, error: scheduleError } = await supabaseClient
        .from('automated_blog_schedules')
        .select('*')
        .eq('id', schedule_id)
        .eq('is_active', true)
        .single()

      if (scheduleError || !scheduleData) {
        throw new Error(`Schedule not found or inactive: ${schedule_id}`)
      }
      schedule = scheduleData
    } else {
      // For cron execution, get all active schedules for current time
      const currentTime = new Date().toTimeString().slice(0, 5) // HH:MM format
      const { data: schedules, error: schedulesError } = await supabaseClient
        .from('automated_blog_schedules')
        .select('*')
        .eq('is_active', true)

      if (schedulesError || !schedules || schedules.length === 0) {
        console.log('⚠️ AUTOMATION: No active schedules found')
        return new Response(
          JSON.stringify({ success: false, message: 'No active schedules found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Filter schedules by current execution time
      const activeSchedules = schedules.filter(s => 
        s.execution_times && s.execution_times.includes(currentTime)
      )

      if (activeSchedules.length === 0) {
        console.log(`⚠️ AUTOMATION: No schedules for current time: ${currentTime}`)
        return new Response(
          JSON.stringify({ success: false, message: `No schedules for time: ${currentTime}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Use first matching schedule
      schedule = activeSchedules[0]
    }

    console.log('📋 AUTOMATION: Using schedule:', {
      name: schedule.schedule_name,
      blogs_per_day: schedule.blogs_per_day,
      ai_provider: schedule.ai_provider
    })

    // Get active CTA buttons for random selection
    const { data: ctaButtonsData, error: ctaError } = await supabaseClient
      .from('blog_settings')
      .select('setting_value')
      .eq('setting_key', 'blog_cta_buttons')
      .single()

    let activeCTAButtons: CTAButton[] = []
    if (!ctaError && ctaButtonsData) {
      const allCTAButtons = ctaButtonsData.setting_value as CTAButton[]
      activeCTAButtons = allCTAButtons.filter(btn => btn.isActive)
    }

    console.log('🎯 AUTOMATION: Found active CTA buttons:', activeCTAButtons.length)

    // Get topic templates for intelligent topic selection
    const { data: topicTemplates, error: topicError } = await supabaseClient
      .from('blog_topic_templates')
      .select('*')
      .eq('is_active', true)

    const generatedBlogs = []
    const errors = []

    // Generate blogs according to schedule
    for (let i = 0; i < schedule.blogs_per_day; i++) {
      try {
        console.log(`🔄 AUTOMATION: Generating blog ${i + 1}/${schedule.blogs_per_day}`)

        // Select topic (use provided topic for instant generation or select random)
        const selectedTopic = topic || await selectRandomTopic(schedule, topicTemplates || [])
        console.log(`📝 AUTOMATION: Selected topic: ${selectedTopic}`)

        // Select random CTA buttons (1-3 buttons)
        const selectedCTAs = selectRandomCTAButtons(activeCTAButtons)
        console.log(`🎯 AUTOMATION: Selected ${selectedCTAs.length} CTA buttons`)

        // Generate content with enhanced Heidehof focus for instant generation
        const blogContent = await generateBlogContent(
          selectedTopic,
          schedule,
          selectedCTAs,
          supabaseClient,
          trigger_type === 'instant'
        )

        if (blogContent.success) {
          generatedBlogs.push({
            topic: selectedTopic,
            blog_id: blogContent.blog_id,
            cta_count: selectedCTAs.length,
            hero_image: blogContent.has_hero_image
          })
          console.log(`✅ AUTOMATION: Blog ${i + 1} generated successfully: ${blogContent.blog_id}`)
        } else {
          errors.push(`Blog ${i + 1}: ${blogContent.error}`)
          console.error(`❌ AUTOMATION: Blog ${i + 1} failed:`, blogContent.error)
        }

        // Add delay between generations to avoid rate limits
        if (i < schedule.blogs_per_day - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000))
        }

      } catch (error) {
        console.error(`❌ AUTOMATION: Error generating blog ${i + 1}:`, error)
        errors.push(`Blog ${i + 1}: ${error.message}`)
      }
    }

    // Log execution result (skip for instant generation to avoid clutter)
    const success = generatedBlogs.length > 0
    if (trigger_type !== 'instant') {
      await logExecution(
        supabaseClient,
        schedule.id,
        success,
        generatedBlogs.length,
        errors.length > 0 ? errors.join('; ') : null,
        {
          trigger_type,
          execution_context,
          generated_blogs: generatedBlogs,
          errors: errors,
          total_cta_buttons_available: activeCTAButtons.length
        }
      )

      // Update schedule's last execution time (only for real schedules)
      if (schedule_id && schedule_id !== 'instant-' + Date.now()) {
        await supabaseClient
          .from('automated_blog_schedules')
          .update({ 
            last_execution: new Date().toISOString(),
            // Calculate next execution time based on execution_times
            next_execution: calculateNextExecution(schedule.execution_times)
          })
          .eq('id', schedule.id)
      }
    }

    const result = {
      success: true,
      schedule_name: schedule.schedule_name,
      blogs_generated: generatedBlogs.length,
      total_requested: schedule.blogs_per_day,
      errors_count: errors.length,
      generated_blogs: generatedBlogs,
      execution_time: new Date().toISOString()
    }

    console.log('🎉 AUTOMATION: Execution completed:', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ AUTOMATION: Critical error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function generateInstantBlog(topic: string, instant_config: any, supabaseClient: any) {
  console.log('⚡ INSTANT: Starting instant blog generation with topic:', topic);
  
  // Get active CTA buttons for random selection
  const { data: ctaButtonsData, error: ctaError } = await supabaseClient
    .from('blog_settings')
    .select('setting_value')
    .eq('setting_key', 'blog_cta_buttons')
    .single()

  let activeCTAButtons: CTAButton[] = []
  if (!ctaError && ctaButtonsData) {
    const allCTAButtons = ctaButtonsData.setting_value as CTAButton[]
    activeCTAButtons = allCTAButtons.filter(btn => btn.isActive)
  }

  // Select random CTA buttons (1-3 buttons)
  const selectedCTAs = selectRandomCTAButtons(activeCTAButtons)
  console.log(`🎯 INSTANT: Selected ${selectedCTAs.length} CTA buttons`)

  // Create schedule object from instant config
  const schedule: AutomationSchedule = {
    id: 'instant-' + Date.now(),
    schedule_name: instant_config.schedule_name,
    is_active: true,
    blogs_per_day: 1,
    execution_times: instant_config.execution_times,
    topics_pool: instant_config.topics_pool,
    ai_provider: instant_config.ai_provider,
    content_type: instant_config.content_type,
    tone: instant_config.tone,
    word_count: instant_config.word_count,
    enable_hero_images: instant_config.enable_hero_images,
    image_style: instant_config.image_style,
    settings: instant_config.settings
  };

  // Generate blog content
  const blogContent = await generateBlogContent(
    topic,
    schedule,
    selectedCTAs,
    supabaseClient,
    true // isInstantGeneration = true
  )

  if (blogContent.success) {
    console.log(`✅ INSTANT: Blog generated successfully: ${blogContent.blog_id}`)
    return {
      success: true,
      blog_id: blogContent.blog_id,
      title: blogContent.title,
      has_hero_image: blogContent.has_hero_image,
      cta_buttons_count: selectedCTAs.length,
      execution_time: new Date().toISOString()
    }
  } else {
    console.error(`❌ INSTANT: Blog generation failed:`, blogContent.error)
    throw new Error(blogContent.error)
  }
}

async function selectRandomTopic(schedule: AutomationSchedule, templates: any[]): Promise<string> {
  // Combine schedule topics with template topics
  let availableTopics = [...schedule.topics_pool]
  
  // Add template-based topics
  if (templates.length > 0) {
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
    const templateTopics = generateTopicsFromTemplate(randomTemplate)
    availableTopics = [...availableTopics, ...templateTopics]
  }

  // Add seasonal/current topics
  const seasonalTopics = getCurrentSeasonalTopics()
  availableTopics = [...availableTopics, ...seasonalTopics]

  // Select random topic
  if (availableTopics.length === 0) {
    return generateFallbackTopic()
  }

  return availableTopics[Math.floor(Math.random() * availableTopics.length)]
}

function selectRandomCTAButtons(activeCTAs: CTAButton[]): CTAButton[] {
  if (activeCTAs.length === 0) return []

  // Randomly select 1-3 CTA buttons
  const maxCTAs = Math.min(3, activeCTAs.length)
  const numCTAs = Math.floor(Math.random() * maxCTAs) + 1

  // Shuffle and select
  const shuffled = [...activeCTAs].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, numCTAs)
}

async function generateBlogContent(
  topic: string,
  schedule: AutomationSchedule,
  ctaButtons: CTAButton[],
  supabaseClient: any,
  isInstantGeneration: boolean = false
) {
  try {
    // Enhanced instructions for perfect SEO and Heidehof branding
    const customInstructions = isInstantGeneration 
      ? `Erstelle einen SEO-optimierten, luxuriösen Blog-Artikel für "Das Hotel Der Heidehof" in Geimersheim bei Ingolstadt, Bayern. 
         WICHTIG für TOP SEO-Rankings:
         - Verwende H1, H2, H3 Struktur mit Keywords
         - Integriere LSI-Keywords natürlich (Wellness, Spa, Luxus, Bayern, Ingolstadt, Donau)
         - Erstelle interne Links zu Hotel-Services
         - Füge lokale SEO-Bezüge ein (Geimersheim, Ingolstadt, Audi-Stadt, Donau-Region)
         - Verwende Featured Snippet-optimierte Listen und Absätze
         - Integriere semantische Keywords für bessere Auffindbarkeit
         - Schreibe für E-A-T (Expertise, Authority, Trust)
         - Optimiere für Voice Search mit natürlichen Frage-Antwort-Strukturen
         Der Artikel soll professionell, einladend und suchmaschinenoptimiert sein.`
      : `Erstelle einen SEO-optimierten Blog-Artikel für Das Hotel Heidehof. Verwende lokale Keywords und strukturierte Inhalte für bessere Rankings.`;

    // Generate blog content using the enhanced blog workflow
    const { data: contentResult, error: contentError } = await supabaseClient.functions.invoke('generate-blog-content', {
      body: {
        topic,
        keywords: extractKeywordsFromTopic(topic),
        contentType: schedule.content_type,
        tone: schedule.tone,
        wordCount: schedule.word_count.toString(),
        provider: schedule.ai_provider,
        targetAudience: 'Hotel-Gäste und Wellness-Interessierte',
        customInstructions
      }
    })

    if (contentError || !contentResult?.content) {
      throw new Error(`Content generation failed: ${contentError?.message || 'No content generated'}`)
    }

    // Clean and structure the content
    const cleanedContent = contentResult.content
      .replace(/^#{1,6}\s*/gm, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Convert italic
      .trim()

    // Extract title from content or generate one
    const title = extractTitleFromContent(cleanedContent) || generateTitleFromTopic(topic)
    
    // Generate SEO-friendly slug
    const slug = generateSlug(title)

    // Generate hero image if enabled
    let heroImageUrl = null
    if (schedule.enable_hero_images) {
      heroImageUrl = await generateHeroImage(topic, schedule.image_style, title)
    }

    // Generate enhanced SEO metadata
    const seoMeta = generateEnhancedMetaTags(cleanedContent, topic, extractKeywordsFromTopic(topic).join(', '))
    const lsiKeywords = generateLSIKeywords(topic, cleanedContent)
    const internalLinks = generateIntelligentInternalLinks(cleanedContent, topic)
    
    // Calculate advanced SEO score
    const seoAnalysis = calculateAdvancedSeoScore(
      cleanedContent, 
      topic, 
      extractKeywordsFromTopic(topic).join(', '), 
      seoMeta.metaTitle, 
      seoMeta.metaDescription
    )

    // Insert blog post with enhanced SEO and CTA integration
    const { data: blogPost, error: insertError } = await supabaseClient
      .from('blog_posts')
      .insert([{
        title: title,
        slug: slug,
        content: enhanceContentWithCTAs(cleanedContent, ctaButtons),
        excerpt: seoMeta.metaDescription,
        featured_image: heroImageUrl,
        meta_title: seoMeta.metaTitle,
        meta_description: seoMeta.metaDescription,
        keywords: seoMeta.keywords,
        local_keywords: ['Hotel Heidehof', 'Geimersheim', 'Ingolstadt', 'Bayern', 'Donau', 'Audi-Stadt', ...lsiKeywords],
        categories: [schedule.content_type],
        status: 'published',
        author: 'SEO Blog-Automation',
        content_type: schedule.content_type,
        tone: schedule.tone,
        ai_provider: schedule.ai_provider,
        ai_generated: true,
        cta_buttons: ctaButtons.length > 0 ? ctaButtons : null,
        word_count: countWords(cleanedContent),
        reading_time: Math.ceil(countWords(cleanedContent) / 200),
        published_at: new Date().toISOString(),
        geo_location: 'Geimersheim bei Ingolstadt, Bayern',
        seo_score: seoAnalysis.score,
        schema_org: seoMeta.schemaOrg
      }])
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to insert blog post: ${insertError.message}`)
    }

    return {
      success: true,
      blog_id: blogPost.id,
      title: title,
      slug: slug,
      has_hero_image: !!heroImageUrl,
      cta_buttons_count: ctaButtons.length
    }

  } catch (error) {
    console.error('❌ Error generating blog content:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

async function generateHeroImage(topic: string, imageStyle: string, title: string): Promise<string | null> {
  try {
    // Create professional image prompt that avoids hotel exteriors
    const prompt = createProfessionalImagePrompt(topic, imageStyle, title)
    
    // Use Pollinations API for image generation
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=630&seed=${Math.floor(Math.random() * 1000000)}`
    
    console.log('🖼️ AUTOMATION: Generated hero image:', imageUrl)
    return imageUrl
    
  } catch (error) {
    console.error('❌ Hero image generation failed:', error)
    // Return fallback abstract image
    return `https://image.pollinations.ai/prompt/abstract%20luxury%20wellness%20concept%20professional%20photography?width=1200&height=630&seed=42`
  }
}

function createProfessionalImagePrompt(topic: string, style: string, title: string): string {
  // Extract keywords from topic for targeted image generation
  const topicKeywords = extractKeywordsFromTopic(topic).slice(0, 3).join(', ')
  
  // Define professional image concepts that avoid showing hotels directly
  const conceptPrompts = {
    wellness: 'zen stones on water, bamboo, soft lighting, spa concept, minimalist wellness design',
    spa: 'luxury spa stones, essential oils, candles, relaxation elements, peaceful atmosphere',
    gastronomie: 'elegant food presentation, fine dining concept, culinary artistry, gourmet styling',
    zimmer: 'luxury bedding details, elegant fabrics, comfort elements, boutique style',
    business: 'modern conference setup, professional environment, clean workspace, success concept',
    events: 'elegant event details, celebration elements, sophisticated decor, festive atmosphere',
    restaurant: 'fine dining table setting, culinary excellence, gourmet presentation, elegant ambiance',
    tagung: 'professional meeting space, modern technology, business success, corporate elegance',
    übernachtung: 'luxury linens, comfort details, peaceful bedroom atmosphere, premium hospitality',
    hochzeit: 'elegant wedding details, romantic atmosphere, celebration elements, luxury styling',
    natur: 'German countryside landscape, rolling hills, forest paths, natural beauty Bavaria',
    regional: 'Bavarian cultural elements, traditional craftsmanship, regional specialties, local heritage'
  }
  
  // Determine which concept to use based on topic
  let conceptKey = 'wellness' // default
  for (const [key, concept] of Object.entries(conceptPrompts)) {
    if (topic.toLowerCase().includes(key)) {
      conceptKey = key
      break
    }
  }
  
  const selectedConcept = conceptPrompts[conceptKey as keyof typeof conceptPrompts]
  
  // Style definitions for professional photography
  const styleDefinitions = {
    professional: 'clean composition, high-end photography, corporate aesthetic, pristine quality',
    elegant: 'sophisticated lighting, luxury textures, refined details, premium feel',
    luxury: 'opulent materials, gold accents, exclusive atmosphere, five-star quality',
    natural: 'organic elements, natural lighting, earth tones, sustainable luxury',
    modern: 'contemporary design, minimalist approach, sleek lines, cutting-edge style'
  }
  
  const styleDescription = styleDefinitions[style as keyof typeof styleDefinitions] || styleDefinitions.professional
  
  // Construct the complete prompt avoiding direct hotel imagery
  return `Professional natural hotel and wellness image for blog article "${title}", ${selectedConcept}, ${styleDescription}, related to ${topicKeywords}, Hotel Heidehof style, 4K resolution, professional photography`
}

async function logExecution(
  supabaseClient: any,
  scheduleId: string,
  success: boolean,
  blogsGenerated: number,
  errorMessage: string | null,
  executionDetails: any
) {
  try {
    await supabaseClient
      .from('blog_automation_logs')
      .insert([{
        schedule_id: scheduleId,
        execution_time: new Date().toISOString(),
        success: success,
        blogs_generated: blogsGenerated,
        error_message: errorMessage,
        execution_details: executionDetails
      }])
  } catch (error) {
    console.error('❌ Failed to log execution:', error)
  }
}

function calculateNextExecution(executionTimes: string[]): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Find next execution time today
  for (const time of executionTimes.sort()) {
    const [hours, minutes] = time.split(':').map(Number)
    const executionDate = new Date(today.getTime())
    executionDate.setHours(hours, minutes, 0, 0)
    
    if (executionDate > now) {
      return executionDate.toISOString()
    }
  }
  
  // If no more executions today, get first execution tomorrow
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const [hours, minutes] = executionTimes.sort()[0].split(':').map(Number)
  tomorrow.setHours(hours, minutes, 0, 0)
  
  return tomorrow.toISOString()
}

// Helper functions
function generateTopicsFromTemplate(template: any): string[] {
  const variations = [
    `${template.template} für Entspannung`,
    `${template.template} im Hotel`,
    `${template.template} Trends 2024`,
    `Luxus ${template.template} Erlebnis`,
    `${template.template} Guide für Gäste`
  ]
  return variations
}

function getCurrentSeasonalTopics(): string[] {
  const month = new Date().getMonth()
  const seasons = {
    winter: ['Winterwellness', 'Entspannung bei Kälte', 'Sauna im Winter', 'Gemütliche Hotelmomente'],
    spring: ['Frühjahrskur', 'Detox im Frühling', 'Aufbruchstimmung', 'Neue Energie tanken'],
    summer: ['Sommererholung', 'Outdoor Wellness', 'Entspannung in der Natur', 'Urlaubsfeeling'],
    autumn: ['Herbstwellness', 'Entspannung im Herbst', 'Gemütlichkeit', 'Innere Ruhe finden']
  }
  
  if (month >= 2 && month <= 4) return seasons.spring
  if (month >= 5 && month <= 7) return seasons.summer
  if (month >= 8 && month <= 10) return seasons.autumn
  return seasons.winter
}

function generateFallbackTopic(): string {
  const fallbackTopics = [
    'Wellness und Entspannung im modernen Hotel',
    'Die perfekte Auszeit vom Alltag',
    'Luxuriöse Hotelmomente erleben',
    'Entspannung für Körper und Seele',
    'Der Weg zur inneren Ruhe'
  ]
  return fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)]
}

function extractKeywordsFromTopic(topic: string): string[] {
  const commonWords = ['der', 'die', 'das', 'und', 'oder', 'für', 'im', 'am', 'ein', 'eine', 'zu', 'von', 'mit']
  return topic
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .slice(0, 5)
}

function extractTitleFromContent(content: string): string | null {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/[#*]/g, '').trim()
    if (firstLine.length > 10 && firstLine.length < 100) {
      return firstLine
    }
  }
  return null
}

function generateTitleFromTopic(topic: string): string {
  const titleTemplates = [
    `${topic}: Ein Leitfaden für Hotelgäste`,
    `Entdecken Sie ${topic} im Hotel Heidehof`,
    `${topic} - Ihr Weg zur Entspannung`,
    `Luxus ${topic} Erlebnis`,
    `${topic}: Tipps und Inspiration`
  ]
  return titleTemplates[Math.floor(Math.random() * titleTemplates.length)]
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[äöüß]/g, char => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[char] || char))
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)
}

function generateExcerpt(content: string, maxLength: number = 200): string {
  const cleanText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  if (cleanText.length <= maxLength) return cleanText
  
  const truncated = cleanText.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
}

function countWords(text: string): number {
  return text.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length
}

// Enhanced CTA Content Integration
function enhanceContentWithCTAs(content: string, ctaButtons: CTAButton[]): string {
  if (ctaButtons.length === 0) return content
  
  const paragraphs = content.split('\n\n')
  let enhancedContent = ''
  
  // Insert CTA buttons strategically throughout content
  paragraphs.forEach((paragraph, index) => {
    enhancedContent += paragraph + '\n\n'
    
    // Insert CTA after specific positions (25%, 50%, 75% of content)
    const insertPositions = [
      Math.floor(paragraphs.length * 0.25),
      Math.floor(paragraphs.length * 0.5),
      Math.floor(paragraphs.length * 0.75)
    ]
    
    if (insertPositions.includes(index) && ctaButtons.length > 0) {
      const cta = ctaButtons[index % ctaButtons.length]
      enhancedContent += `\n<div class="blog-cta-container" style="margin: 2rem 0; padding: 1.5rem; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; border-left: 4px solid #dc2626; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
  <h3 style="margin: 0 0 1rem 0; color: #dc2626; font-size: 1.2rem;">${cta.title}</h3>
  <p style="margin: 0 0 1.5rem 0; color: #374151; line-height: 1.6;">${cta.description}</p>
  <a href="${cta.url}" 
     class="cta-button" 
     style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px;"
     onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 12px rgba(220, 38, 38, 0.4)'"
     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(220, 38, 38, 0.3)'">
    Jetzt ${cta.title} →
  </a>
</div>\n\n`
    }
  })
  
  return enhancedContent
}