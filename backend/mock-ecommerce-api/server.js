const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Load sample data
const knowledgeBasePath = path.join(__dirname, '../../knowledge-base/sample-data.json');
let sampleData = {};

try {
  const rawData = fs.readFileSync(knowledgeBasePath, 'utf8');
  sampleData = JSON.parse(rawData);
} catch (error) {
  console.error('Error loading sample data:', error);
  sampleData = { knowledge_base: { product_info: [] } };
}

// Mock product database
const products = sampleData.knowledge_base.product_info || [];

// Helper function to search products
function searchProducts(query, language = 'en') {
  const searchTerms = query.toLowerCase().split(' ');
  
  return products.filter(product => {
    const nameField = language === 'de' ? 'name_de' : 'name_en';
    const descField = language === 'de' ? 'description_de' : 'description_en';
    
    const searchText = `${product[nameField]} ${product[descField]} ${product.category} ${product.subcategory}`.toLowerCase();
    
    return searchTerms.some(term => searchText.includes(term));
  }).map(product => ({
    id: product.id,
    name: language === 'de' ? product.name_de : product.name_en,
    description: language === 'de' ? product.description_de : product.description_en,
    price: product.price_eur,
    currency: 'EUR',
    sizes: product.sizes,
    colors: product.colors,
    category: product.category,
    subcategory: product.subcategory,
    material: product.material,
    inStock: true, // Mock stock status
    stockCount: Math.floor(Math.random() * 50) + 10 // Random stock count
  }));
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Product search endpoint
app.post('/api/products/search', (req, res) => {
  try {
    const { query, language = 'en' } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Query parameter is required',
        success: false 
      });
    }

    const results = searchProducts(query, language);
    
    res.json({
      success: true,
      query,
      language,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// Get product by ID
app.get('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'en' } = req.query;
    
    const product = products.find(p => p.id === id);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        success: false 
      });
    }

    const result = {
      id: product.id,
      name: language === 'de' ? product.name_de : product.name_en,
      description: language === 'de' ? product.description_de : product.description_en,
      price: product.price_eur,
      currency: 'EUR',
      sizes: product.sizes,
      colors: product.colors,
      category: product.category,
      subcategory: product.subcategory,
      material: product.material,
      careInstructions: language === 'de' ? product.care_instructions_de : product.care_instructions_en,
      inStock: true,
      stockCount: Math.floor(Math.random() * 50) + 10
    };

    res.json({
      success: true,
      product: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// Check stock for specific product and size
app.post('/api/products/stock', (req, res) => {
  try {
    const { productId, size, color } = req.body;
    
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        success: false 
      });
    }

    // Mock stock check
    const hasSize = !size || product.sizes.includes(size);
    const hasColor = !color || product.colors.includes(color);
    const stockCount = hasSize && hasColor ? Math.floor(Math.random() * 20) + 5 : 0;

    res.json({
      success: true,
      productId,
      size,
      color,
      inStock: stockCount > 0,
      stockCount,
      available: hasSize && hasColor,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Stock check error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// List all products
app.get('/api/products', (req, res) => {
  try {
    const { language = 'en', category, limit = 10 } = req.query;
    
    let filteredProducts = products;
    
    if (category) {
      filteredProducts = products.filter(p => 
        p.category.toLowerCase() === category.toLowerCase() ||
        p.subcategory.toLowerCase() === category.toLowerCase()
      );
    }

    const results = filteredProducts.slice(0, parseInt(limit)).map(product => ({
      id: product.id,
      name: language === 'de' ? product.name_de : product.name_en,
      description: language === 'de' ? product.description_de : product.description_en,
      price: product.price_eur,
      currency: 'EUR',
      category: product.category,
      subcategory: product.subcategory,
      inStock: true
    }));

    res.json({
      success: true,
      products: results,
      count: results.length,
      total: filteredProducts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Products list error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      success: false 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    success: false 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    success: false 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock E-commerce API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Products loaded: ${products.length}`);
});

module.exports = app;
