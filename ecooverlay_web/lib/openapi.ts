export const openapiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'EcoOverlay API',
    version: '1.0.0',
    description: 'API for product carbon footprint and sustainability data',
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  paths: {
    '/api/health': {
      get: {
        summary: 'Health check',
        description: 'Check API and database health status',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    timestamp: { type: 'string' },
                    services: {
                      type: 'object',
                      properties: {
                        database: { type: 'string' },
                        api: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/product/{upc}': {
      get: {
        summary: 'Get product by UPC',
        description: 'Retrieve product details including footprint and alternatives',
        parameters: [
          {
            name: 'upc',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Product found',
          },
          '404': {
            description: 'Product not found',
          },
        },
      },
      post: {
        summary: 'Create product',
        description: 'Create a new product',
        parameters: [
          {
            name: 'upc',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  brand: { type: 'string' },
                  category: { type: 'string' },
                  imageUrl: { type: 'string', format: 'uri' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Product created',
          },
        },
      },
    },
    '/api/footprint/{productId}': {
      get: {
        summary: 'Get product footprints',
        description: 'Retrieve all carbon footprint data for a product',
        parameters: [
          {
            name: 'productId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Footprints retrieved',
          },
        },
      },
      post: {
        summary: 'Add footprint data',
        description: 'Add carbon footprint data for a product',
        parameters: [
          {
            name: 'productId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['totalCo2e', 'method', 'sources'],
                properties: {
                  scope1: { type: 'number' },
                  scope2: { type: 'number' },
                  scope3: { type: 'number' },
                  totalCo2e: { type: 'number' },
                  method: { type: 'string' },
                  sources: { type: 'array' },
                  confidence: { type: 'number', minimum: 0, maximum: 1 },
                  uncertainty: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Footprint created',
          },
        },
      },
    },
    '/api/alternates/{productId}': {
      get: {
        summary: 'Get alternative products',
        description: 'Get lower-carbon alternatives for a product',
        parameters: [
          {
            name: 'productId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Alternatives retrieved',
          },
        },
      },
    },
  },
}
