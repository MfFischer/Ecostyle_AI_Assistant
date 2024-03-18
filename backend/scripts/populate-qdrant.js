const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const COLLECTION_NAME = 'knowledge_base';

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

// Load knowledge base data
const knowledgeBasePath = path.join(__dirname, '../../knowledge-base/sample-data.json');
let knowledgeBase;

try {
  const rawData = fs.readFileSync(knowledgeBasePath, 'utf8');
  knowledgeBase = JSON.parse(rawData);
} catch (error) {
  console.error('Error loading knowledge base:', error);
  process.exit(1);
}

// Function to create embeddings using OpenAI
async function createEmbedding(text) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: text,
        model: 'text-embedding-3-small'
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error.response?.data || error.message);
    throw error;
  }
}

// Function to create Qdrant collection
async function createCollection() {
  try {
    const response = await axios.put(
      `${QDRANT_URL}/collections/${COLLECTION_NAME}`,
      {
        vectors: {
          size: 1536, // text-embedding-3-small dimension
          distance: 'Cosine'
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Collection created successfully');
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('Collection already exists');
      return;
    }
    console.error('Error creating collection:', error.response?.data || error.message);
    throw error;
  }
}

// Function to add points to collection
async function addPoints(points) {
  try {
    const response = await axios.put(
      `${QDRANT_URL}/collections/${COLLECTION_NAME}/points`,
      {
        points: points
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`Added ${points.length} points to collection`);
    return response.data;
  } catch (error) {
    console.error('Error adding points:', error.response?.data || error.message);
    throw error;
  }
}

// Main function to populate the database
async function populateDatabase() {
  console.log('Starting Qdrant population...');
  
  try {
    // Create collection
    await createCollection();
    
    const points = [];
    let pointId = 1;
    
    // Process FAQs
    console.log('Processing FAQs...');
    for (const faq of knowledgeBase.knowledge_base.faqs) {
      // English version
      const englishText = `${faq.question_en} ${faq.answer_en}`;
      const englishEmbedding = await createEmbedding(englishText);
      
      points.push({
        id: pointId++,
        vector: englishEmbedding,
        payload: {
          type: 'faq',
          id: faq.id,
          question: faq.question_en,
          answer: faq.answer_en,
          language: 'en',
          category: faq.category,
          tags: faq.tags
        }
      });
      
      // German version
      const germanText = `${faq.question_de} ${faq.answer_de}`;
      const germanEmbedding = await createEmbedding(germanText);
      
      points.push({
        id: pointId++,
        vector: germanEmbedding,
        payload: {
          type: 'faq',
          id: faq.id,
          question: faq.question_de,
          answer: faq.answer_de,
          language: 'de',
          category: faq.category,
          tags: faq.tags
        }
      });
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Process Products
    console.log('Processing products...');
    for (const product of knowledgeBase.knowledge_base.product_info) {
      // English version
      const englishText = `${product.name_en} ${product.description_en} ${product.category} ${product.subcategory}`;
      const englishEmbedding = await createEmbedding(englishText);
      
      points.push({
        id: pointId++,
        vector: englishEmbedding,
        payload: {
          type: 'product',
          id: product.id,
          name: product.name_en,
          description: product.description_en,
          language: 'en',
          category: product.category,
          subcategory: product.subcategory,
          price: product.price_eur,
          sizes: product.sizes,
          colors: product.colors,
          material: product.material
        }
      });
      
      // German version
      const germanText = `${product.name_de} ${product.description_de} ${product.category} ${product.subcategory}`;
      const germanEmbedding = await createEmbedding(germanText);
      
      points.push({
        id: pointId++,
        vector: germanEmbedding,
        payload: {
          type: 'product',
          id: product.id,
          name: product.name_de,
          description: product.description_de,
          language: 'de',
          category: product.category,
          subcategory: product.subcategory,
          price: product.price_eur,
          sizes: product.sizes,
          colors: product.colors,
          material: product.material
        }
      });
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Process Company Info
    console.log('Processing company info...');
    const companyInfo = knowledgeBase.knowledge_base.company_info;
    
    // English version
    const companyEnglishText = `${companyInfo.name} ${companyInfo.description_en} ${companyInfo.values.join(' ')}`;
    const companyEnglishEmbedding = await createEmbedding(companyEnglishText);
    
    points.push({
      id: pointId++,
      vector: companyEnglishEmbedding,
      payload: {
        type: 'company_info',
        name: companyInfo.name,
        description: companyInfo.description_en,
        language: 'en',
        founded: companyInfo.founded,
        headquarters: companyInfo.headquarters,
        values: companyInfo.values,
        contact: companyInfo.contact,
        businessHours: companyInfo.business_hours
      }
    });
    
    // German version
    const companyGermanText = `${companyInfo.name} ${companyInfo.description_de} ${companyInfo.values.join(' ')}`;
    const companyGermanEmbedding = await createEmbedding(companyGermanText);
    
    points.push({
      id: pointId++,
      vector: companyGermanEmbedding,
      payload: {
        type: 'company_info',
        name: companyInfo.name,
        description: companyInfo.description_de,
        language: 'de',
        founded: companyInfo.founded,
        headquarters: companyInfo.headquarters,
        values: companyInfo.values,
        contact: companyInfo.contact,
        businessHours: companyInfo.business_hours
      }
    });
    
    // Add all points to Qdrant
    console.log(`Adding ${points.length} points to Qdrant...`);
    await addPoints(points);
    
    console.log('Database population completed successfully!');
    console.log(`Total points added: ${points.length}`);
    
  } catch (error) {
    console.error('Error populating database:', error);
    process.exit(1);
  }
}

// Run the population script
if (require.main === module) {
  populateDatabase();
}

module.exports = { populateDatabase };
