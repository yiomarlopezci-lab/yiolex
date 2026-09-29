import 'dotenv/config';
import express from 'express';
import cookieSession from 'cookie-session';
import { pool } from './db.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const sessionSecret = process.env.SESSION_SECRET || (process.env.VERCEL === '1' ? '' : 'ventas-local-development-secret');

if (!sessionSecret) throw new Error('SESSION_SECRET debe configurarse en Vercel.');

app.set('trust proxy', 1);
app.use(express.json());
app.use(cookieSession({
  name: 'ventas_session',
  keys: [sessionSecret],
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.VERCEL === '1',
  maxAge: 8 * 60 * 60 * 1000,
}));

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const requireUser = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ message: 'Inicia sesión para continuar.' });
  next();
};
const text = (value) => String(value ?? '').trim();
const positiveId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const sendDatabaseError = (error, res) => {
  if (error.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ message: 'No se puede eliminar: este registro tiene ventas asociadas.' });
  }
  throw error;
};

app.post('/api/login', asyncRoute(async (req, res) => {
  const user = text(req.body.user);
  const password = text(req.body.password);
  if (!user || !password) return res.status(400).json({ message: 'Completa usuario y contraseña.' });
  const [rows] = await pool.execute(
    'SELECT IdEmpleado AS id, User AS username, Nombres AS name, Telefono AS phone FROM empleado WHERE User = ? AND Dni = ? AND Estado = ?',
    [user, password, '1'],
  );
  if (!rows.length) return res.status(401).json({ message: 'Usuario o contraseña incorrectos.' });
  req.session.user = rows[0];
  res.json(rows[0]);
}));

app.get('/api/session', (req, res) => res.json({ user: req.session.user || null }));
app.post('/api/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});
app.use('/api', requireUser);

app.get('/api/dashboard', asyncRoute(async (_req, res) => {
  const [[clients]] = await pool.query('SELECT COUNT(*) AS total FROM cliente');
  const [[products]] = await pool.query('SELECT COUNT(*) AS total FROM producto');
  const [[employees]] = await pool.query('SELECT COUNT(*) AS total FROM empleado');
  const [[sales]] = await pool.query('SELECT COUNT(*) AS total, COALESCE(SUM(Monto), 0) AS amount FROM ventas');
  const [recent] = await pool.query(
    'SELECT v.IdVentas AS id, v.NumeroSerie AS serial, v.FechaVentas AS date, v.Monto AS amount, c.Nombres AS client FROM ventas v LEFT JOIN cliente c ON c.IdCliente = v.IdCliente ORDER BY v.IdVentas DESC LIMIT 5',
  );
  res.json({ clients: clients.total, products: products.total, employees: employees.total, sales: sales.total, amount: sales.amount, recent });
}));

const resources = {
  clients: {
    table: 'cliente', id: 'IdCliente',
    columns: 'IdCliente AS id, Dni AS dni, Nombres AS name, Direccion AS address, Estado AS status',
    fields: ['Dni', 'Nombres', 'Direccion', 'Estado'],
    values: (body) => [text(body.dni), text(body.name), text(body.address), text(body.status || '1')],
    required: ['dni', 'name'],
  },
  employees: {
    table: 'empleado', id: 'IdEmpleado',
    columns: 'IdEmpleado AS id, Dni AS dni, Nombres AS name, Telefono AS phone, Estado AS status, User AS username',
    fields: ['Dni', 'Nombres', 'Telefono', 'Estado', 'User'],
    values: (body) => [text(body.dni), text(body.name), text(body.phone), text(body.status || '1'), text(body.username)],
    required: ['dni', 'name', 'username'],
  },
  products: {
    table: 'producto', id: 'IdProducto',
    columns: 'IdProducto AS id, Nombres AS name, Precio AS price, Stock AS stock, Estado AS status',
    fields: ['Nombres', 'Precio', 'Stock', 'Estado'],
    values: (body) => [text(body.name), Number(body.price), Number(body.stock), text(body.status || '1')],
    required: ['name', 'price', 'stock'],
  },
};

for (const [route, config] of Object.entries(resources)) {
  app.get(`/api/${route}`, asyncRoute(async (req, res) => {
    const term = `%${text(req.query.search)}%`;
    const searchable = route === 'products'
      ? '(Nombres LIKE ? OR CAST(IdProducto AS CHAR) LIKE ?)'
      : route === 'employees'
        ? '(Nombres LIKE ? OR Dni LIKE ? OR User LIKE ?)'
        : '(Nombres LIKE ? OR Dni LIKE ?)';
    const params = route === 'employees' ? [term, term, term] : route === 'products' ? [term, term] : [term, term];
    const [rows] = await pool.execute(`SELECT ${config.columns} FROM ${config.table} WHERE ${searchable} ORDER BY ${config.id} DESC`, params);
    res.json(rows);
  }));

  app.post(`/api/${route}`, asyncRoute(async (req, res) => {
    const values = config.values(req.body);
    if (config.required.some((field) => !text(req.body[field]))) {
      return res.status(400).json({ message: 'Completa los campos obligatorios.' });
    }
    if (route === 'products' && (values[1] < 0 || values[2] < 0 || !Number.isFinite(values[1]) || !Number.isInteger(values[2]))) {
      return res.status(400).json({ message: 'El precio y el stock deben ser valores válidos.' });
    }
    const placeholders = config.fields.map(() => '?').join(', ');
    const columns = config.fields.map((field) => `\`${field}\``).join(', ');
    const [result] = await pool.execute(`INSERT INTO ${config.table} (${columns}) VALUES (${placeholders})`, values);
    const [rows] = await pool.execute(`SELECT ${config.columns} FROM ${config.table} WHERE ${config.id} = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  }));

  app.put(`/api/${route}/:id`, asyncRoute(async (req, res) => {
    if (!positiveId(req.params.id)) return res.status(400).json({ message: 'Identificador inválido.' });
    const values = config.values(req.body);
    if (config.required.some((field) => !text(req.body[field]))) {
      return res.status(400).json({ message: 'Completa los campos obligatorios.' });
    }
    if (route === 'products' && (values[1] < 0 || values[2] < 0 || !Number.isFinite(values[1]) || !Number.isInteger(values[2]))) {
      return res.status(400).json({ message: 'El precio y el stock deben ser valores válidos.' });
    }
    const assignments = config.fields.map((field) => `\`${field}\` = ?`).join(', ');
    const [result] = await pool.execute(`UPDATE ${config.table} SET ${assignments} WHERE ${config.id} = ?`, [...values, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Registro no encontrado.' });
    const [rows] = await pool.execute(`SELECT ${config.columns} FROM ${config.table} WHERE ${config.id} = ?`, [req.params.id]);
    res.json(rows[0]);
  }));

  app.delete(`/api/${route}/:id`, asyncRoute(async (req, res) => {
    if (!positiveId(req.params.id)) return res.status(400).json({ message: 'Identificador inválido.' });
    try {
      const [result] = await pool.execute(`DELETE FROM ${config.table} WHERE ${config.id} = ?`, [req.params.id]);
      if (!result.affectedRows) return res.status(404).json({ message: 'Registro no encontrado.' });
      res.json({ ok: true });
    } catch (error) {
      sendDatabaseError(error, res);
    }
  }));
}

app.get('/api/sales/next-number', asyncRoute(async (_req, res) => {
  const [[row]] = await pool.query('SELECT MAX(CAST(NumeroSerie AS UNSIGNED)) AS last FROM ventas');
  res.json({ serial: String(Number(row.last || 0) + 1).padStart(8, '0') });
}));

app.get('/api/sales', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT v.IdVentas AS id, v.NumeroSerie AS serial, v.FechaVentas AS date, v.Monto AS amount, v.Estado AS status, c.Nombres AS client, e.Nombres AS employee FROM ventas v LEFT JOIN cliente c ON c.IdCliente = v.IdCliente LEFT JOIN empleado e ON e.IdEmpleado = v.IdEmpleado ORDER BY v.IdVentas DESC',
  );
  res.json(rows);
}));

app.get('/api/sales/:id', asyncRoute(async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT d.IdDetalleVentas AS id, p.Nombres AS product, d.Cantidad AS quantity, d.PrecioVenta AS price, d.Cantidad * d.PrecioVenta AS subtotal FROM detalle_ventas d JOIN producto p ON p.IdProducto = d.IdProducto WHERE d.IdVentas = ?',
    [req.params.id],
  );
  res.json(rows);
}));

app.post('/api/sales', asyncRoute(async (req, res) => {
  const clientId = Number(req.body.clientId);
  const lines = Array.isArray(req.body.lines) ? req.body.lines : [];
  if (!positiveId(clientId) || !lines.length || lines.some((line) => !positiveId(line.productId) || !Number.isInteger(Number(line.quantity)) || Number(line.quantity) < 1)) {
    return res.status(400).json({ message: 'Selecciona un cliente y agrega productos con cantidades válidas.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [clients] = await connection.execute('SELECT IdCliente FROM cliente WHERE IdCliente = ?', [clientId]);
    if (!clients.length) throw Object.assign(new Error('El cliente seleccionado no existe.'), { status: 400 });
    const [[serialRow]] = await connection.query('SELECT MAX(CAST(NumeroSerie AS UNSIGNED)) AS last FROM ventas');
    const serial = String(Number(serialRow.last || 0) + 1).padStart(8, '0');
    const details = [];
    let amount = 0;

    for (const line of lines) {
      const productId = Number(line.productId);
      const quantity = Number(line.quantity);
      const [products] = await connection.execute('SELECT IdProducto, Precio, Stock FROM producto WHERE IdProducto = ? AND Estado = ? FOR UPDATE', [productId, '1']);
      if (!products.length) throw Object.assign(new Error(`El producto ${productId} no está disponible.`), { status: 400 });
      const product = products[0];
      if (Number(product.Stock) < quantity) throw Object.assign(new Error(`Stock insuficiente para el producto ${productId}.`), { status: 409 });
      amount += Number(product.Precio) * quantity;
      details.push({ productId, quantity, price: Number(product.Precio), stock: Number(product.Stock) });
    }

    const [sale] = await connection.execute(
      'INSERT INTO ventas (IdCliente, IdEmpleado, NumeroSerie, FechaVentas, Monto, Estado) VALUES (?, ?, ?, CURDATE(), ?, ?)',
      [clientId, req.session.user.id, serial, amount, '1'],
    );
    for (const detail of details) {
      await connection.execute(
        'INSERT INTO detalle_ventas (IdVentas, IdProducto, Cantidad, PrecioVenta) VALUES (?, ?, ?, ?)',
        [sale.insertId, detail.productId, detail.quantity, detail.price],
      );
      await connection.execute('UPDATE producto SET Stock = ? WHERE IdProducto = ?', [detail.stock - detail.quantity, detail.productId]);
    }
    await connection.commit();
    res.status(201).json({ id: sale.insertId, serial, amount });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ message: error.status ? error.message : 'Ocurrió un error al consultar la base de datos.' });
});

if (process.env.VERCEL !== '1') {
  app.listen(port, () => console.log(`API disponible en http://localhost:${port}`));
}

export default app;