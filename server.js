const pg = require("pg");
const express = require("express");
const app = express();
app.use(express.json());
app.use(require("morgan")("dev"));
const port = process.env.PORT || 1433;
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
    SELECT * FROM employees;
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `
    SELECT * FROM departments;
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
    INSERT INTO employees(name, department_id)
    VALUES($1, (SELECT id FROM departments WHERE name=$2))
    RETURNING *;
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
          DELETE from employees
          WHERE id = $1
        `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
    UPDATE employees
    SET name=$1, department_id=$2, updated_at= now()
    WHERE id=$3 
    RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

const init = async () => {
  await client.connect();
  console.log("connected to database");
  let SQL = `
  DROP TABLE IF EXISTS employees;
  DROP TABLE IF EXISTS departments;
  
  CREATE TABLE departments(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
  );

  CREATE TABLE employees(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    department_id INTEGER REFERENCES departments(id) NOT NULL
);
INSERT INTO departments(name) VALUES('Pick');
INSERT INTO departments(name) VALUES('Count');
INSERT INTO departments(name) VALUES('Stow');
INSERT INTO  employees(name, department_id) VALUES('Martha', (SELECT id FROM departments WHERE name='Pick'));
INSERT INTO  employees(name, department_id) VALUES('Kim', (SELECT id FROM departments WHERE name='Pick'));
INSERT INTO  employees(name, department_id) VALUES('Emitt', (SELECT id FROM departments WHERE name='Stow'));
INSERT INTO  employees(name, department_id) VALUES('Cassandra', (SELECT id FROM departments WHERE name='Count'));
INSERT INTO  employees(name, department_id) VALUES('Steve', (SELECT id FROM departments WHERE name='Stow'));
`;
  await client.query(SQL);
  console.log("table created");
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
