// backend/server.js
const express = require('express');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();
app.use(bodyParser.json());

// PostgreSQL client configuration
const client = new Client({
    user: 'postgres', // Replace with your PostgreSQL username
    host: 'localhost',
    database: 'postgres',
    password: 'damjan', // Replace with your PostgreSQL password
    port: 5432,
});

client.connect();

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Automobile API',
            version: '1.0.0',
            description: 'API for managing automobiles',
        },
    },
    apis: ['server.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const schema = buildSchema(`
  type Automobile {
    id: ID!
    make: String
    model: String
    year: Int
    vin: String
  }

  type Query {
    automobiles: [Automobile]
    automobile(id: ID!): Automobile
  }

  type Mutation {
    addAutomobile(make: String, model: String, year: Int, vin: String): Automobile
    updateAutomobile(id: ID!, make: String, model: String, year: Int, vin: String): Automobile
    deleteAutomobile(id: ID!): String
  }
`);

const root = {
    automobiles: async () => {
        const result = await client.query('SELECT * FROM automobiles');
        return result.rows;
    },
    automobile: async ({ id }) => {
        const result = await client.query('SELECT * FROM automobiles WHERE id = $1', [id]);
        return result.rows[0];
    },
    addAutomobile: async ({ make, model, year, vin }) => {
        const result = await client.query(
            'INSERT INTO automobiles (make, model, year, vin) VALUES ($1, $2, $3, $4) RETURNING *',
            [make, model, year, vin]
        );
        return result.rows[0];
    },
    updateAutomobile: async ({ id, make, model, year, vin }) => {
        const result = await client.query(
            'UPDATE automobiles SET make = $1, model = $2, year = $3, vin = $4 WHERE id = $5 RETURNING *',
            [make, model, year, vin, id]
        );
        return result.rows[0];
    },
    deleteAutomobile: async ({ id }) => {
        await client.query('DELETE FROM automobiles WHERE id = $1', [id]);
        return `Automobile with ID ${id} deleted`;
    },
};

app.use(
    '/graphql',
    graphqlHTTP({
        schema: schema,
        rootValue: root,
        graphiql: true,
    })
);

/**
 * @swagger
 * /api/automobiles:
 *   get:
 *     description: Get all automobiles
 *     responses:
 *       200:
 *         description: Success
 */
app.get('/api/automobiles', async (req, res) => {
    try {
        const result = await client.query('SELECT * FROM automobiles');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/automobiles/{id}:
 *   get:
 *     description: Get an automobile by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
app.get('/api/automobiles/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await client.query('SELECT * FROM automobiles WHERE id = $1', [id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/automobiles:
 *   post:
 *     description: Add a new automobile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               vin:
 *                 type: string
 *     responses:
 *       201:
 *         description: Automobile created
 */
app.post('/api/automobiles', async (req, res) => {
    const { make, model, year, vin } = req.body;
    try {
        const result = await client.query(
            'INSERT INTO automobiles (make, model, year, vin) VALUES ($1, $2, $3, $4) RETURNING *',
            [make, model, year, vin]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/automobiles/{id}:
 *   put:
 *     description: Update an existing automobile
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               make:
 *                 type: string
 *               model:
 *                 type: string
 *               year:
 *                 type: integer
 *               vin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Automobile updated
 */
app.put('/api/automobiles/:id', async (req, res) => {
    const { id } = req.params;
    const { make, model, year, vin } = req.body;
    try {
        const result = await client.query(
            'UPDATE automobiles SET make = $1, model = $2, year = $3, vin = $4 WHERE id = $5 RETURNING *',
            [make, model, year, vin, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /api/automobiles/{id}:
 *   delete:
 *     description: Delete an automobile
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Automobile deleted
 */
app.delete('/api/automobiles/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await client.query('DELETE FROM automobiles WHERE id = $1', [id]);
        res.json({ message: `Automobile with ID ${id} deleted` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
