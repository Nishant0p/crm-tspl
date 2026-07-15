import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pg from 'pg'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'
import PDFDocument from 'pdfkit'
import fs from 'fs'

dotenv.config({ override: true })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Setup PostgreSQL pool
const { Pool } = pg
let pool
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })
    console.log('◇ Database pool initialized successfully.')

    // Auto-run schema initialization and alteration migrations
    try {
      console.log('◇ Auto-migrating / verifying database schema...')
      const client = await pool.connect()
      try {
        const sqlPath = path.join(__dirname, 'schema.sql')
        if (fs.existsSync(sqlPath)) {
          const sql = fs.readFileSync(sqlPath, 'utf8')
          await client.query(sql)
          console.log('◇ Database schema initialized and seed verified.')
        }

        // Run database alterations
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS phone VARCHAR(50)
        `)
        await client.query(`
          ALTER TABLE candidates 
          ADD COLUMN IF NOT EXISTS referred_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL
        `)
        await client.query(`
          ALTER TABLE candidates 
          ADD COLUMN IF NOT EXISTS assigned_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL
        `)
        await client.query(`
          CREATE TABLE IF NOT EXISTS admin_referral_codes (
            id SERIAL PRIMARY KEY,
            admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            code VARCHAR(100) NOT NULL UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `)
        // NEW: add referral_codes table if not exists
        await client.query(`
          CREATE TABLE IF NOT EXISTS referral_codes (
            id SERIAL PRIMARY KEY,
            code VARCHAR(50) NOT NULL UNIQUE,
            owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('candidate', 'admin')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `)
        await client.query(`
          CREATE TABLE IF NOT EXISTS candidate_courses (
            id SERIAL PRIMARY KEY,
            candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
            course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
            progress INTEGER DEFAULT 0,
            completed BOOLEAN DEFAULT FALSE,
            enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP WITH TIME ZONE,
            UNIQUE(candidate_id, course_id)
          )
        `)
        await client.query(`
          CREATE TABLE IF NOT EXISTS courses (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            instructor VARCHAR(255),
            duration VARCHAR(100),
            syllabus TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `)
        await client.query(`
          ALTER TABLE candidates ADD COLUMN IF NOT EXISTS used_referral_code_id INTEGER REFERENCES referral_codes(id) ON DELETE SET NULL
        `)
        await client.query(`
          CREATE TABLE IF NOT EXISTS support_tickets (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            subject VARCHAR(255) DEFAULT 'General Support',
            status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `)
        await client.query(`
          ALTER TABLE support_chats ADD COLUMN IF NOT EXISTS ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE
        `)
        await client.query(`
          ALTER TABLE support_chats ADD COLUMN IF NOT EXISTS sender_name VARCHAR(100)
        `)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_support_chats_ticket_id ON support_chats(ticket_id)
        `)
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id)
        `)
        console.log('◇ Database column alterations successfully verified.')
      } catch (dbErr) {
        console.error('⚠️ Database migration failed:', dbErr.message)
      } finally {
        client.release()
      }
    } catch (connErr) {
      console.error('⚠️ Could not connect to database for migration:', connErr.message)
    }
  } catch (e) {
    console.error("Failed to initialize database pool:", e.message)
  }
} else {
  console.warn("⚠️ DATABASE_URL not found in .env file.")
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Mailer: Send Mail via SMTP
async function sendMailViaSMTP(email, subject, htmlContent) {
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  if (!smtpUser || !smtpPass) {
    return false
  }
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10)
  const smtpSecure = process.env.SMTP_SECURE !== 'false' // Default to true
  const smtpFrom = process.env.SMTP_FROM || `"TSPL Platform" <${smtpUser}>`

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    })
    await transporter.sendMail({
      from: smtpFrom,
      to: email,
      subject: subject,
      html: htmlContent
    })
    console.log(`◇ Email successfully dispatched via SMTP (${smtpHost}) to ${email}`)
    return true
  } catch (err) {
    console.error('SMTP delivery failed:', err.message)
    return false
  }
}

// Mailer: Send Welcome HTML Email
async function sendWelcomeEmail(email, name) {
  const html = `
    <div style="background-color: #F0F4F8; padding: 42px 24px; font-family: 'Inter', Arial, sans-serif; min-height: 100%;">
      <div style="background-color: #FFFFFF; color: #1E3A8A; padding: 40px; border-radius: 12px; max-width: 550px; margin: 0 auto; box-shadow: 0 8px 30px rgba(37,99,235,0.06); border-top: 6px solid #2563EB; border-bottom: 6px solid #F97316;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4B85TWhCXk89F7RwuEhn30IIis1HSNpXk7Lrqz-bgVQ&s" alt="TSPL Logo" style="height: 44px; width: auto; vertical-align: middle; border-radius: 4px; margin-right: 10px; display: inline-block;" />
          <span style="font-size: 24px; font-weight: 800; color: #1E3A8A; letter-spacing: 0.5px; text-transform: uppercase; display: inline-block; vertical-align: middle; font-family: 'Inter', Arial, sans-serif;">
            TSPL <span style="color: #F97316;">GROUP</span>
          </span>
        </div>
        <div style="border-top: 1px solid #DBEAFE; margin-bottom: 24px;"></div>
        <h2 style="color: #1E3A8A; font-size: 22px; margin-top: 0; margin-bottom: 16px; font-weight: 700; text-align: center;">
          Welcome Aboard, ${name}!
        </h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 28px; text-align: left;">
          Hello <strong style="color: #1E3A8A;">${name}</strong>,<br>
          Your enterprise profile has been successfully registered. You now have full access to our Unified Sourcing, Job Placements, and Skill Ecosystem.
        </p>
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="background-color: #F97316; padding: 12px 24px; border-radius: 6px; display: inline-block;">
            <span style="color: #FFFFFF; font-weight: bold; font-size: 14px; letter-spacing: 0.5px;">Candidate Profile Verified ✓</span>
          </div>
        </div>
        <div style="border-top: 1px solid #DBEAFE; margin-bottom: 20px;"></div>
        <p style="color: #94A3B8; font-size: 11px; margin: 0; line-height: 1.4; text-align: center;">
          This is an automated notification from TSPL Academic Registry.<br>
          &copy; 2026 TSPL. All internal automation systems apply.
        </p>
      </div>
    </div>
  `
  const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS)
  if (smtpConfigured) {
    return await sendMailViaSMTP(email, 'Welcome to TSPL Platform!', html)
  }
  console.log(`\n======================================================`);
  console.log(`[MOCK Welcome Email]`);
  console.log(`To: ${email}`);
  console.log(`Subject: Welcome to TSPL Platform!`);
  console.log(`Body: Hello ${name}, welcome to the TSPL ecosystem.`);
  console.log(`======================================================\n`);
  return true
}

// Mailer: Send OTP Verification Code Email
async function sendOTPEmail(email, name, otp, type) {
  const isLogin = type === 'login'
  const isSignup = type === 'signup'
  const subject = isSignup ? 'TSPL Portal - Email Verification OTP' : (isLogin ? 'TSPL Portal - Secure Login OTP' : 'TSPL Portal - Password Reset OTP')
  const title = isSignup ? 'Email Verification' : (isLogin ? 'Secure Login Verification' : 'Password Reset Authorization')
  const description = isSignup
    ? 'Please input the following code to verify your email address and activate your TSPL account.'
    : (isLogin
      ? 'Please input the following code in your verification panel to complete your login session.'
      : 'We received a request to change your TSPL account password. Enter this code to verify it is you.')

  const html = `
    <div style="background-color: #F0F4F8; padding: 42px 24px; font-family: 'Inter', Arial, sans-serif; min-height: 100%;">
      <div style="background-color: #FFFFFF; color: #1E3A8A; padding: 40px; border-radius: 12px; max-width: 550px; margin: 0 auto; box-shadow: 0 8px 30px rgba(37,99,235,0.06); border-top: 6px solid #2563EB; border-bottom: 6px solid #F97316;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4B85TWhCXk89F7RwuEhn30IIis1HSNpXk7Lrqz-bgVQ&s" alt="TSPL Logo" style="height: 44px; width: auto; vertical-align: middle; border-radius: 4px; margin-right: 10px; display: inline-block;" />
          <span style="font-size: 24px; font-weight: 800; color: #1E3A8A; letter-spacing: 0.5px; text-transform: uppercase; display: inline-block; vertical-align: middle; font-family: 'Inter', Arial, sans-serif;">
            TSPL <span style="color: #F97316;">GROUP</span>
          </span>
        </div>
        <div style="border-top: 1px solid #DBEAFE; margin-bottom: 24px;"></div>
        <h2 style="color: #1E3A8A; font-size: 22px; margin-top: 0; margin-bottom: 16px; font-weight: 700; text-align: center;">
          ${title}
        </h2>
        <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 28px; text-align: left;">
          Hello <strong style="color: #1E3A8A;">${name}</strong>,<br>
          ${description}
        </p>
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="background-color: #F97316; padding: 16px 40px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);">
            <span style="font-size: 36px; font-weight: 800; color: #FFFFFF; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${otp}
            </span>
          </div>
        </div>
        <p style="color: #475569; font-size: 13px; margin-bottom: 24px; text-align: center;">
          This security verification code will expire in <span style="color: #2563EB; font-weight: 600;">${isSignup ? '10' : (isLogin ? '5' : '10')} minutes</span>.
        </p>
        <div style="border-top: 1px solid #DBEAFE; margin-bottom: 20px;"></div>
        <p style="color: #94A3B8; font-size: 11px; margin: 0; line-height: 1.4; text-align: center;">
          If you did not make this transaction request, please ignore this email securely.<br>
          &copy; 2026 TSPL. All internal automation systems apply.
        </p>
      </div>
    </div>
  `

  console.log(`\n======================================================`);
  console.log(`[SERVER CONSOLE OTP - ${type.toUpperCase()}]`);
  console.log(`To: ${email}`);
  console.log(`OTP Code: ${otp}`);
  console.log(`======================================================\n`);

  const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS)
  if (smtpConfigured) {
    const success = await sendMailViaSMTP(email, subject, html)
    if (!success) {
      console.log(`⚠️ SMTP email delivery failed for ${email}. Please copy the OTP from the console log above.`)
    }
  }

  return true
}

// Auto-provision Super Admin on startup
const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD
if (pool && superAdminEmail && superAdminPassword) {
  pool.query('SELECT * FROM users WHERE email = $1', [superAdminEmail.toLowerCase().trim()])
    .then(async (result) => {
      const passHash = hashPassword(superAdminPassword)
      if (result.rows.length === 0) {
        await pool.query(
          'INSERT INTO users (email, password_hash, name, default_role) VALUES ($1, $2, $3, $4)',
          [superAdminEmail.toLowerCase().trim(), passHash, 'System Super Admin', 'super_admin']
        )
        console.log(`◇ Automatically provisioned default Super Admin account: ${superAdminEmail}`)
      } else {
        const existing = result.rows[0]
        if (existing.password_hash !== passHash || existing.default_role !== 'super_admin') {
          await pool.query(
            'UPDATE users SET password_hash = $1, default_role = $2 WHERE email = $3',
            [passHash, 'super_admin', superAdminEmail.toLowerCase().trim()]
          )
          console.log(`◇ Force-updated Super Admin credentials/role to match env for: ${superAdminEmail}`)
        }
      }
    })
    .catch(err => {
      console.error('Failed to auto-provision super admin:', err.message)
    })
}

// ==================== API ROUTES ====================

// 1. POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database pool is not initialized.' })
    const { email, password, name } = req.body
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' })
    }
    const passHash = hashPassword(password)
    const userRole = 'candidate'

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, default_role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, default_role',
      [email.toLowerCase().trim(), passHash, name.trim(), userRole]
    )
    const user = result.rows[0]

    // Generate and send signup verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await pool.query(
      'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at',
      [email.toLowerCase().trim(), otp, expiresAt]
    )

    await sendOTPEmail(email.toLowerCase().trim(), name.trim(), otp, 'signup')

    res.status(201).json({
      message: 'Account created! A verification code has been sent to your email.',
      otp_required: true,
      email: email.toLowerCase().trim(),
      user
    })
  } catch (error) {
    console.error('Register error:', error.message)
    res.status(500).json({ error: error.message || 'Registration failed' })
  }
})

// 2. POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database pool is not initialized.' })
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password credentials' })
    }
    const user = result.rows[0]
    const passHash = hashPassword(password)
    if (user.password_hash !== passHash) {
      return res.status(400).json({ error: 'Invalid email or password credentials' })
    }

    if (user.default_role === 'super_admin') {
      return res.status(200).json({
        message: 'Identity confirmed successfully.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          default_role: user.default_role
        }
      })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await pool.query(
      'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at',
      [email.toLowerCase().trim(), otp, expiresAt]
    )

    await sendOTPEmail(email.toLowerCase().trim(), user.name, otp, 'login')

    res.status(200).json({
      message: 'Secure OTP code dispatched to your registered email.',
      otp_required: true,
      email: email.toLowerCase().trim()
    })
  } catch (error) {
    console.error('Login error:', error.message)
    res.status(500).json({ error: error.message || 'Login failed' })
  }
})

// 3. POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database pool is not initialized.' })
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required' })
    }
    const result = await pool.query('SELECT * FROM otps WHERE email = $1', [email.toLowerCase().trim()])
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No active verification code found for this email' })
    }
    const record = result.rows[0]
    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: 'Verification code has expired' })
    }
    if (record.otp_code !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Try again.' })
    }

    await pool.query('DELETE FROM otps WHERE email = $1', [email.toLowerCase().trim()])

    const userResult = await pool.query('SELECT id, email, name, default_role FROM users WHERE email = $1', [email.toLowerCase().trim()])
    const user = userResult.rows[0]

    res.status(200).json({
      message: 'Identity confirmed successfully.',
      user
    })
  } catch (error) {
    console.error('Verify OTP error:', error.message)
    res.status(500).json({ error: error.message || 'OTP verification failed' })
  }
})

// 4. POST /api/auth/request-reset
app.post('/api/auth/request-reset', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database pool is not initialized.' })
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' })
    }
    const result = await pool.query('SELECT name FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (result.rows.length === 0) {
      return res.status(200).json({ message: 'If the email is registered, a password reset code has been sent.' })
    }
    const name = result.rows[0].name
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await pool.query(
      'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at',
      [email.toLowerCase().trim(), otp, expiresAt]
    )

    await sendOTPEmail(email.toLowerCase().trim(), name, otp, 'reset')

    res.status(200).json({
      message: 'Reset verification code sent to your email.',
      email: email.toLowerCase().trim()
    })
  } catch (error) {
    console.error('Request reset error:', error.message)
    res.status(500).json({ error: error.message || 'Reset request failed' })
  }
})

// 5. POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database pool is not initialized.' })
    const { email, otp, newPassword } = req.body
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' })
    }
    const result = await pool.query('SELECT * FROM otps WHERE email = $1', [email.toLowerCase().trim()])
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No active password reset verification code found' })
    }
    const record = result.rows[0]
    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: 'Verification code has expired' })
    }
    if (record.otp_code !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    const newHash = hashPassword(newPassword)
    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [newHash, email.toLowerCase().trim()])
    await pool.query('DELETE FROM otps WHERE email = $1', [email.toLowerCase().trim()])

    res.status(200).json({ message: 'Password updated successfully. You can now login.' })
  } catch (error) {
    console.error('Reset password error:', error.message)
    res.status(500).json({ error: error.message || 'Password reset failed' })
  }
})

// 6. POST /api/auth/me
app.post('/api/auth/me', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database pool is not initialized.' })
    const { email } = req.body
    if (!email) {
      return res.status(401).json({ error: 'Authentication missing' })
    }
    const result = await pool.query('SELECT id, email, name, default_role FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User does not exist in register database' })
    }
    res.status(200).json({ user: result.rows[0] })
  } catch (error) {
    console.error('Auth me error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// 7. GET /api/admin/users
app.get('/api/admin/users', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database pool is not initialized.' })
    const adminEmail = req.headers['x-admin-email']
    if (!adminEmail) {
      return res.status(401).json({ error: 'Admin identifier not provided' })
    }
    const adminCheck = await pool.query('SELECT default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()])
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].default_role !== 'super_admin') {
      return res.status(403).json({ error: 'Access restricted to system Super Admin' })
    }
    const result = await pool.query('SELECT id, email, name, default_role FROM users ORDER BY name ASC')
    res.status(200).json({ users: result.rows })
  } catch (error) {
    console.error('Admin users error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// 8. POST /api/admin/update-role
app.post('/api/admin/update-role', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database pool is not initialized.' })
    const adminEmail = req.headers['x-admin-email']
    const { userId, newRole } = req.body
    if (!adminEmail || !userId || !newRole) {
      return res.status(400).json({ error: 'Admin headers and parameters required' })
    }
    const adminCheck = await pool.query('SELECT default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()])
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].default_role !== 'super_admin') {
      return res.status(403).json({ error: 'Access restricted to system Super Admin' })
    }

    await pool.query('UPDATE users SET default_role = $1 WHERE id = $2', [newRole, userId])
    res.status(200).json({ message: 'User role updated successfully' })
  } catch (error) {
    console.error('Update role error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// 8b. GET /api/admin/candidates
app.get('/api/admin/candidates', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database pool is not initialized.' })
    const adminEmail = req.headers['x-admin-email']
    if (!adminEmail) {
      return res.status(401).json({ error: 'Admin identifier not provided' })
    }
    const adminCheck = await pool.query('SELECT default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()])
    if (adminCheck.rows.length === 0 || (adminCheck.rows[0].default_role !== 'super_admin' && adminCheck.rows[0].default_role !== 'sourcing_head' && adminCheck.rows[0].default_role !== 'recruiter')) {
      return res.status(403).json({ error: 'Access restricted to administrators' })
    }
    const result = await pool.query(`
      SELECT 
        c.id as candidate_id, 
        u.id as user_id, 
        u.name, 
        u.email, 
        c.referral_code, 
        c.is_verified, 
        c.registration_source, 
        c.created_at,
        ci.name as city_name, 
        st.name as state_name, 
        es.name as specialization_name
      FROM candidates c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN cities ci ON c.city_id = ci.id
      LEFT JOIN districts di ON ci.district_id = di.id
      LEFT JOIN states st ON di.state_id = st.id
      LEFT JOIN education_specializations es ON c.specialization_id = es.id
      ORDER BY c.created_at DESC
    `)
    res.status(200).json({ candidates: result.rows })
  } catch (error) {
    console.error('Admin candidates error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// 8c. POST /api/admin/candidates/assign-referral
app.post('/api/admin/candidates/assign-referral', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database pool is not initialized.' })
    const adminEmail = req.headers['x-admin-email']
    const { candidateId, referralCode } = req.body
    if (!adminEmail || !candidateId) {
      return res.status(400).json({ error: 'Admin headers and candidateId are required' })
    }
    const adminCheck = await pool.query('SELECT id, default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()])
    if (adminCheck.rows.length === 0 || (adminCheck.rows[0].default_role !== 'super_admin' && adminCheck.rows[0].default_role !== 'sourcing_head' && adminCheck.rows[0].default_role !== 'recruiter')) {
      return res.status(403).json({ error: 'Access restricted to administrators' })
    }
    const adminId = adminCheck.rows[0].id

    // Generate code if none provided
    const code = referralCode ? referralCode.trim().toUpperCase() : 'TSPL' + Math.floor(1000 + Math.random() * 9000).toString();

    // Check if code is already used
    const codeCheck = await pool.query('SELECT id FROM candidates WHERE referral_code = $1', [code])
    if (codeCheck.rows.length > 0) {
      return res.status(400).json({ error: `Referral code ${code} is already in use by another candidate.` })
    }

    await pool.query('UPDATE candidates SET referral_code = $1, assigned_by_admin_id = $2 WHERE id = $3', [code, adminId, candidateId])
    res.status(200).json({ message: 'Referral code assigned successfully', referralCode: code })
  } catch (error) {
    console.error('Assign referral error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Get all admin referral codes
app.get('/api/admin/referral-codes', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database pool is not initialized.' })
    const adminEmail = req.headers['x-admin-email']
    if (!adminEmail) {
      return res.status(400).json({ error: 'Admin headers are required' })
    }
    const adminCheck = await pool.query('SELECT id, default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()])
    if (adminCheck.rows.length === 0 || (adminCheck.rows[0].default_role !== 'super_admin' && adminCheck.rows[0].default_role !== 'sourcing_head' && adminCheck.rows[0].default_role !== 'recruiter')) {
      return res.status(403).json({ error: 'Access restricted to administrators' })
    }

    const result = await pool.query(`
      SELECT arc.*, u.name as admin_name, u.email as admin_email 
      FROM admin_referral_codes arc
      JOIN users u ON arc.admin_id = u.id
      ORDER BY arc.created_at DESC
    `)
    res.status(200).json({ referralCodes: result.rows })
  } catch (error) {
    console.error('Get admin referral codes error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Create a new admin referral code
app.post('/api/admin/referral-codes', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database pool is not initialized.' })
    const adminEmail = req.headers['x-admin-email']
    const { code } = req.body
    if (!adminEmail) {
      return res.status(400).json({ error: 'Admin headers are required' })
    }
    const adminCheck = await pool.query('SELECT id, default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()])
    if (adminCheck.rows.length === 0 || (adminCheck.rows[0].default_role !== 'super_admin' && adminCheck.rows[0].default_role !== 'sourcing_head' && adminCheck.rows[0].default_role !== 'recruiter')) {
      return res.status(403).json({ error: 'Access restricted to administrators' })
    }
    const adminId = adminCheck.rows[0].id

    // Generate code if none provided
    const finalCode = code ? code.trim().toUpperCase() : 'ADM' + Math.floor(1000 + Math.random() * 9000).toString();

    // Check if code is already used in admin_referral_codes
    const codeCheck = await pool.query('SELECT id FROM admin_referral_codes WHERE code = $1', [finalCode])
    if (codeCheck.rows.length > 0) {
      return res.status(400).json({ error: `Referral code ${finalCode} is already in use.` })
    }

    const insertRes = await pool.query(
      'INSERT INTO admin_referral_codes (admin_id, code) VALUES ($1, $2) RETURNING *',
      [adminId, finalCode]
    )

    res.status(200).json({ message: 'Referral code created successfully', referralCode: insertRes.rows[0] })
  } catch (error) {
    console.error('Create admin referral code error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// ==========================================
// 1. CASCADING HIERARCHY SELECTORS
// ==========================================

// Get Countries
app.get('/api/hierarchy/countries', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM countries ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get States by Country
app.get('/api/hierarchy/states', async (req, res) => {
  const { countryId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM states WHERE country_id = $1 ORDER BY name ASC', [countryId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Districts by State
app.get('/api/hierarchy/districts', async (req, res) => {
  const { stateId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM districts WHERE state_id = $1 ORDER BY name ASC', [stateId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Cities by District
app.get('/api/hierarchy/cities', async (req, res) => {
  const { districtId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM cities WHERE district_id = $1 ORDER BY name ASC', [districtId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Education Levels
app.get('/api/hierarchy/education-levels', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM education_levels ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Education Branches by Level
app.get('/api/hierarchy/education-branches', async (req, res) => {
  const { levelId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM education_branches WHERE level_id = $1 ORDER BY name ASC', [levelId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Education Specializations by Branch
app.get('/api/hierarchy/education-specializations', async (req, res) => {
  const { branchId } = req.query;
  try {
    const result = await pool.query('SELECT * FROM education_specializations WHERE branch_id = $1 ORDER BY name ASC', [branchId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. CANDIDATE REGISTRATION & REFERRALS
// ==========================================

// MODIFIED: /api/candidates/register – now supports multiple-use referral codes
app.post('/api/candidates/register', async (req, res) => {
  const {
    name, email, password, referralCode, source, cityId, educationSpecializationId
  } = req.body;

  if (!name || !email || !password || !cityId || !educationSpecializationId) {
    return res.status(400).json({ error: 'All registration fields are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if user already exists
    const checkUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (checkUser.rows.length > 0) {
      throw new Error('An account with this email address already exists.');
    }

    // Insert user record
    const passHash = hashPassword(password);
    const userQuery = `
      INSERT INTO users (email, password_hash, name, default_role) 
      VALUES ($1, $2, $3, 'candidate') 
      RETURNING id, name, email
    `;
    const userRes = await client.query(userQuery, [email.toLowerCase().trim(), passHash, name.trim()]);
    const userId = userRes.rows[0].id;

    // --- FIXED REFERRAL LOGIC ---
    let referredById = null;
    let referredByAdminId = null;
    let usedReferralCodeId = null;

    if (referralCode) {
      // First check the new referral_codes table (SELECT id too!)
      const codeQuery = 'SELECT id, owner_id, owner_type FROM referral_codes WHERE code = $1';
      const codeRes = await client.query(codeQuery, [referralCode.trim().toUpperCase()]);

      if (codeRes.rows.length > 0) {
        const owner = codeRes.rows[0];
        usedReferralCodeId = owner.id; // correctly use fetched id
        if (owner.owner_type === 'admin') {
          // owner_id is the admin's user ID
          referredByAdminId = owner.owner_id;
        } else if (owner.owner_type === 'candidate') {
          // owner_id is a user ID – resolve to candidate ID
          const refCandRes = await client.query('SELECT id FROM candidates WHERE user_id = $1', [owner.owner_id]);
          if (refCandRes.rows.length > 0) {
            referredById = refCandRes.rows[0].id;
          } else {
            // Referrer user exists but has no candidate record yet – store as admin fallback
            referredByAdminId = owner.owner_id;
          }
        }
      } else {
        // Fallback: check old candidate referral_code column (backward compatibility)
        const oldRef = await client.query('SELECT id, assigned_by_admin_id FROM candidates WHERE referral_code = $1', [referralCode.trim().toUpperCase()]);
        if (oldRef.rows.length > 0) {
          referredById = oldRef.rows[0].id;
          referredByAdminId = oldRef.rows[0].assigned_by_admin_id;
        } else {
          throw new Error('Invalid referral code. Please check and try again.');
        }
      }
    }

    // Register Candidate Profile
    const candQuery = `
      INSERT INTO candidates (
        user_id, referred_by_id, referred_by_admin_id, 
        city_id, specialization_id, registration_source,
        used_referral_code_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, referral_code
    `;
    const candRes = await client.query(candQuery, [
      userId, referredById, referredByAdminId,
      parseInt(cityId, 10), parseInt(educationSpecializationId, 10),
      source || 'web',
      usedReferralCodeId
    ]);
    const candidateId = candRes.rows[0].id;

    // --- AUTO-ENROLL IN DEFAULT COURSES ---
    const coursesRes = await client.query('SELECT id FROM courses');
    for (const courseRow of coursesRes.rows) {
      await client.query(
        `INSERT INTO candidate_courses (candidate_id, course_id, progress)
         VALUES ($1, $2, 0) ON CONFLICT DO NOTHING`,
        [candidateId, courseRow.id]
      );
    }

    // Generate and send verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await client.query(
      'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at',
      [email.toLowerCase().trim(), otp, expiresAt]
    );

    await sendOTPEmail(email.toLowerCase().trim(), name.trim(), otp, 'signup');

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Candidate profile registered successfully. Verify OTP to activate.',
      otp_required: true,
      email: email.toLowerCase().trim(),
      userId,
      candidateId,
      referralLink: `http://localhost:${PORT}/register?ref=${candRes.rows[0].referral_code}`
    });

  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// 3. CANDIDATE PROFILE & APPLICATIONS
// ==========================================

app.get('/api/candidates/profile', async (req, res) => {
  const { userId, email } = req.query;
  try {
    let query = `
      SELECT 
        u.name, 
        u.email, 
        u.id as user_id, 
        c.id as candidate_id, 
        c.referral_code, 
        c.is_verified, 
        c.registration_source, 
        c.created_at,
        ci.name as city_name,
        di.name as district_name,
        st.name as state_name,
        co.name as country_name,
        el.name as edu_level,
        eb.name as edu_branch,
        es.name as edu_specialization,
        ref.referral_code as referred_by
      FROM candidates c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN cities ci ON c.city_id = ci.id
      LEFT JOIN districts di ON ci.district_id = di.id
      LEFT JOIN states st ON di.state_id = st.id
      LEFT JOIN countries co ON st.country_id = co.id
      LEFT JOIN education_specializations es ON c.specialization_id = es.id
      LEFT JOIN education_branches eb ON es.branch_id = eb.id
      LEFT JOIN education_levels el ON eb.level_id = el.id
      LEFT JOIN candidates ref ON c.referred_by_id = ref.id
    `;
    const params = [];
    if (userId) {
      query += ` WHERE u.id = $1`;
      params.push(userId);
    } else if (email) {
      query += ` WHERE u.email = $1`;
      params.push(email.toLowerCase().trim());
    } else {
      return res.status(400).json({ error: 'Either userId or email is required.' });
    }
    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate profile not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/candidates/claim-referral', async (req, res) => {
  const { userId, referralCode } = req.body;
  if (!userId || !referralCode) {
    return res.status(400).json({ error: 'User ID and referral code are required.' });
  }

  try {
    // 1. Fetch candidate matching the userId
    const candCheck = await pool.query('SELECT id, referred_by_id, referred_by_admin_id FROM candidates WHERE user_id = $1', [userId]);
    if (candCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate profile not found.' });
    }
    const candidate = candCheck.rows[0];
    if (candidate.referred_by_id || candidate.referred_by_admin_id) {
      return res.status(400).json({ error: 'You have already claimed a referral code.' });
    }

    // 2. Fetch candidate who owns this referralCode or admin referral code
    const adminCodeCheck = await pool.query('SELECT admin_id FROM admin_referral_codes WHERE code = $1', [referralCode.trim().toUpperCase()]);
    let referredById = null;
    let referredByAdminId = null;
    let codeString = referralCode.trim().toUpperCase();

    if (adminCodeCheck.rows.length > 0) {
      referredByAdminId = adminCodeCheck.rows[0].admin_id;
    } else {
      const sponsorCheck = await pool.query('SELECT id, referral_code, assigned_by_admin_id FROM candidates WHERE referral_code = $1', [referralCode.trim().toUpperCase()]);
      if (sponsorCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid referral code. Please check and try again.' });
      }
      const sponsor = sponsorCheck.rows[0];
      if (sponsor.id === candidate.id) {
        return res.status(400).json({ error: 'You cannot refer yourself.' });
      }
      referredById = sponsor.id;
      referredByAdminId = sponsor.assigned_by_admin_id;
      codeString = sponsor.referral_code;
    }

    // 3. Update candidate profile with referred_by_id and referred_by_admin_id
    await pool.query(
      'UPDATE candidates SET referred_by_id = $1, referred_by_admin_id = $2 WHERE id = $3',
      [referredById, referredByAdminId, candidate.id]
    );

    res.json({ message: 'Referral code claimed successfully!', referred_by: codeString });
  } catch (err) {
    console.error('Claim referral error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/candidates/applications', async (req, res) => {
  const { userId, email } = req.query;
  try {
    let query = `
      SELECT a.id, a.job_id, j.title as job_title, j.role_description, j.location, a.status, a.status_updated_at, a.applied_at as applied_date, ol.offer_letter_code
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidates c ON a.candidate_id = c.id
      JOIN users u ON c.user_id = u.id
      LEFT JOIN offer_letters ol ON ol.application_id = a.id
    `;
    const params = [];
    if (userId) {
      query += ` WHERE u.id = $1`;
      params.push(userId);
    } else if (email) {
      query += ` WHERE u.email = $1`;
      params.push(email.toLowerCase().trim());
    } else {
      return res.status(400).json({ error: 'Either userId or email is required.' });
    }
    query += ` ORDER BY a.applied_at DESC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/jobs/apply', async (req, res) => {
  const { jobId, candidateId, email, phone, jobTitle, jobCompany, jobLocation, jobDescription } = req.body;
  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required' });
  }
  
  try {
    // 1. Resolve Candidate ID
    let resolvedCandidateId = candidateId;
    if (!resolvedCandidateId && email) {
      const candRes = await pool.query(
        'SELECT id FROM candidates WHERE user_id = (SELECT id FROM users WHERE email = $1)',
        [email.toLowerCase().trim()]
      );
      if (candRes.rows.length === 0) {
        return res.status(404).json({ error: 'Candidate profile not found for email.' });
      }
      resolvedCandidateId = candRes.rows[0].id;
    }
    if (!resolvedCandidateId) {
      return res.status(400).json({ error: 'Candidate identifier is required.' });
    }

    // 2. Update candidate phone number if provided
    if (phone && email) {
      await pool.query(
        'UPDATE users SET phone = $1 WHERE email = $2',
        [phone.trim(), email.toLowerCase().trim()]
      );
    }

    // 3. Upsert job to database jobs table to guarantee foreign key integrity
    const parsedJobId = typeof jobId === 'string' ? parseInt(jobId.replace(/\D/g, ''), 10) : parseInt(jobId, 10);
    if (isNaN(parsedJobId)) {
      return res.status(400).json({ error: 'Invalid Job ID format.' });
    }

    await pool.query(`
      INSERT INTO jobs (id, title, role_description, location, eligibility_criteria, vacancies)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title, 
        role_description = EXCLUDED.role_description, 
        location = EXCLUDED.location
    `, [
      parsedJobId, 
      jobTitle || 'Corporate Sourcing Officer', 
      jobDescription || 'Unified sourcing and placement drive opportunity with TSPL Group.', 
      jobLocation || 'Bihar / Jharkhand', 
      'Graduation or relevant background preferred', 
      1
    ]);

    // 4. Check for duplicate application
    const checkApp = await pool.query(
      'SELECT id FROM applications WHERE job_id = $1 AND candidate_id = $2',
      [parsedJobId, resolvedCandidateId]
    );
    if (checkApp.rows.length > 0) {
      return res.status(400).json({ error: 'You have already applied for this job.' });
    }

    // 5. Insert Application record
    const insertApp = await pool.query(
      'INSERT INTO applications (job_id, candidate_id, status) VALUES ($1, $2, \'Applied\') RETURNING id, status, applied_at',
      [parsedJobId, resolvedCandidateId]
    );

    res.status(201).json({
      message: 'Application submitted successfully.',
      application: insertApp.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/applications', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Database pool is not initialized.' });
    
    // Verify admin/recruiter role
    const adminEmail = req.headers['x-admin-email'];
    if (!adminEmail) {
      return res.status(401).json({ error: 'Admin email required' });
    }
    const adminCheck = await pool.query('SELECT default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()]);
    if (adminCheck.rows.length === 0 || (adminCheck.rows[0].default_role !== 'super_admin' && adminCheck.rows[0].default_role !== 'sourcing_head' && adminCheck.rows[0].default_role !== 'recruiter')) {
      return res.status(403).json({ error: 'Admin/HR Recruiter access required' });
    }

    const query = `
      SELECT 
        a.id, 
        a.job_id, 
        a.candidate_id, 
        a.status, 
        a.status_updated_at, 
        a.applied_at as applied_date,
        u.name as candidate_name, 
        u.email as candidate_email,
        u.phone as candidate_phone,
        j.title as job_title, 
        j.location as job_location
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN candidates c ON a.candidate_id = c.id
      JOIN users u ON c.user_id = u.id
      ORDER BY a.applied_at DESC
    `;
    const result = await pool.query(query);
    res.json({ applications: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. ADMIN WORKFLOW & AUTOMATED OFFER PDF
// ==========================================

app.put('/api/applications/status', async (req, res) => {
  const { applicationId, newStatus, salaryStipend } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify Application
    const verifyQuery = `
      SELECT a.id, a.candidate_id, u.name as candidate_name, j.title as job_title
      FROM applications a
      JOIN candidates c ON a.candidate_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = $1
    `;
    const verifyRes = await client.query(verifyQuery, [applicationId]);
    if (verifyRes.rows.length === 0) {
      throw new Error('Application records do not exist.');
    }
    const { candidate_name, job_title, candidate_id } = verifyRes.rows[0];

    // Update Status
    await client.query(
      'UPDATE applications SET status = $1, status_updated_at = NOW() WHERE id = $2',
      [newStatus, applicationId]
    );

    let offerGenerated = false;
    let offerLetterCode = null;

    if (newStatus === 'Selected') {
      offerLetterCode = `OL-${candidate_id}-${Date.now().toString().slice(-5)}`;
      const stipend = salaryStipend || 25000.00;
      const textBody = `Selected for the role of ${job_title} with stipend/salary ${stipend}.`;

      const insertOffer = `
        INSERT INTO offer_letters (application_id, offer_letter_code, salary_stipend, generated_content)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (application_id) DO UPDATE
        SET offer_letter_code = EXCLUDED.offer_letter_code,
            salary_stipend = EXCLUDED.salary_stipend,
            generated_content = EXCLUDED.generated_content
      `;
      await client.query(insertOffer, [applicationId, offerLetterCode, stipend, textBody]);

      await client.query(
        'UPDATE applications SET status = \'Offer\' WHERE id = $1',
        [applicationId]
      );
      offerGenerated = true;
    }

    await client.query('COMMIT');
    res.json({
      message: 'Workflow status updated successfully',
      status: offerGenerated ? 'Offer' : newStatus,
      offerLetterCode
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get Generated Offer PDF File Stream
app.get('/api/candidates/offer-pdf', async (req, res) => {
  const { applicationId } = req.query;
  try {
    const query = `
      SELECT ol.offer_letter_code, ol.salary_stipend, u.name as candidate_name, j.title as job_title
      FROM offer_letters ol
      JOIN applications a ON ol.application_id = a.id
      JOIN candidates c ON a.candidate_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = $1
    `;
    const result = await pool.query(query, [applicationId]);
    if (result.rows.length === 0) {
      return res.status(404).send('Offer Letter Record Not Found.');
    }
    const { candidate_name, job_title, salary_stipend, offer_letter_code } = result.rows[0];

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=OfferLetter_${offer_letter_code}.pdf`);
    doc.pipe(res);

    // Styling
    doc.fillColor('#1E3A8A').fontSize(26).text('TSPL GROUP ENTERPRISE', { align: 'center' });
    doc.fillColor('#F97316').fontSize(10).text('OFFICIAL CONTRACT & WORKFLOW HUB', { align: 'center' });
    doc.moveDown(1);
    doc.strokeColor('#DBEAFE').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(2);

    doc.fillColor('#475569').fontSize(10)
      .text(`Offer Code: ${offer_letter_code}`, { align: 'right' })
      .text(`Issued Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown(2);

    doc.fillColor('#1E3A8A').fontSize(14).text(`Dear ${candidate_name},`, { underline: true });
    doc.moveDown(1);

    doc.fillColor('#334155').fontSize(11).lineGap(4)
      .text(`Based on your qualification results, we are extremely pleased to select you for the position of ${job_title} at TSPL Group. Please review the stipend and compensation breakdown details configured below:`);
    doc.moveDown(2);

    doc.rect(50, doc.y, 500, 50).fillAndStroke('#F0F4F8', '#DBEAFE');
    doc.fillColor('#1E3A8A').fontSize(11).text('MONTHLY EMOLUMENTS:', 65, doc.y - 40);
    doc.fillColor('#F97316').fontSize(13).text(`INR ${parseFloat(salary_stipend).toLocaleString('en-IN')} / Month`, 65, doc.y - 25);
    doc.moveDown(4);

    doc.fillColor('#475569').fontSize(10)
      .text('Please verify all details and sign within 3 business days.');
    doc.end();
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ==========================================
// 5. SUPPORT CHATS SYSTEM
// ==========================================

app.get('/api/support/chat', async (req, res) => {
  const { userId } = req.query;
  try {
    const query = `
      SELECT sc.*, u.name as sender_name 
      FROM support_chats sc
      JOIN users u ON sc.sender_id = u.id
      WHERE sc.sender_id = $1 OR sc.recipient_id = $1
      ORDER BY sc.created_at ASC
    `;
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/support/chat/send', async (req, res) => {
  const { senderId, recipientId, message } = req.body;
  try {
    const query = `
      INSERT INTO support_chats (sender_id, recipient_id, message)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [senderId, recipientId, message]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Candidate-facing support chat retrieval (by candidate email)
app.get('/api/candidates/support-chat', async (req, res) => {
  const { email } = req.query;
  try {
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userId = userRes.rows[0].id;

    const messages = await pool.query(`
      SELECT sc.id, sc.sender_id, sc.recipient_id, sc.message as message_text, sc.is_read, sc.created_at, 
             sender.name as sender_name, sender.default_role as sender_role, recipient.name as recipient_name
      FROM support_chats sc
      JOIN users sender ON sc.sender_id = sender.id
      JOIN users recipient ON sc.recipient_id = recipient.id
      WHERE sc.sender_id = $1 OR sc.recipient_id = $1
      ORDER BY sc.created_at ASC
    `, [userId]);
    res.json(messages.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Candidate-facing support chat submission
app.post('/api/candidates/support-chat', async (req, res) => {
  const { email, message } = req.body;
  try {
    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message are required' });
    }
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const senderId = userRes.rows[0].id;

    // Find first admin/super_admin user to receive candidate chat
    const adminRes = await pool.query(`
      SELECT id FROM users 
      WHERE role = 'admin' OR default_role = 'super_admin' 
      ORDER BY id ASC LIMIT 1
    `);

    let recipientId;
    if (adminRes.rows.length > 0) {
      recipientId = adminRes.rows[0].id;
    } else {
      recipientId = senderId; // Fallback to avoid foreign key failure
    }

    const insertRes = await pool.query(`
      INSERT INTO support_chats (sender_id, recipient_id, message)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [senderId, recipientId, message]);

    const newMsg = insertRes.rows[0];
    const senderNameRes = await pool.query('SELECT name FROM users WHERE id = $1', [senderId]);
    newMsg.sender_name = senderNameRes.rows[0]?.name || 'Candidate';
    newMsg.message_text = newMsg.message;
    newMsg.sender_role = 'candidate';

    res.status(201).json(newMsg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. NEW: REFERRAL & COURSE PROGRESS ENDPOINTS
// ==========================================

// 6a. Generate a referral code for a candidate (authenticated)
app.post('/api/candidates/generate-referral-code', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    // Check if user exists and is a candidate
    const userCheck = await pool.query('SELECT id, default_role FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (userCheck.rows[0].default_role !== 'candidate') {
      return res.status(403).json({ error: 'Only candidates can generate referral codes' });
    }

    // Generate unique code
    const code = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Insert into referral_codes
    const insert = await pool.query(
      'INSERT INTO referral_codes (code, owner_id, owner_type) VALUES ($1, $2, $3) RETURNING *',
      [code, userId, 'candidate']
    );

    // Also update candidate's referral_code column (optional)
    await pool.query('UPDATE candidates SET referral_code = $1 WHERE user_id = $2', [code, userId]);

    res.status(201).json({ referralCode: insert.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      // Unique violation, retry with new code
      return res.status(500).json({ error: 'Failed to generate unique code, try again' });
    }
    res.status(500).json({ error: err.message });
  }
});

// 6b. Get all referral codes (admin only)
app.get('/api/admin/referral-codes', async (req, res) => {
  try {
    const adminEmail = req.headers['x-admin-email'];
    const adminCheck = await pool.query('SELECT default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()]);
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].default_role !== 'super_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const result = await pool.query(`
      SELECT rc.*, u.name as owner_name, u.email as owner_email 
      FROM referral_codes rc
      JOIN users u ON rc.owner_id = u.id
      ORDER BY rc.created_at DESC
    `);
    res.json({ referralCodes: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6c. Get all candidates with referrer info and course progress (admin)
app.get('/api/admin/referrals-progress', async (req, res) => {
  try {
    const adminEmail = req.headers['x-admin-email'];
    const adminCheck = await pool.query('SELECT default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()]);
    if (adminCheck.rows.length === 0 || (adminCheck.rows[0].default_role !== 'super_admin' && adminCheck.rows[0].default_role !== 'sourcing_head')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const query = `
      SELECT 
        c.id as candidate_id,
        u.id as user_id,
        u.name as candidate_name,
        u.email as candidate_email,
        c.referral_code,
        c.registration_source,
        c.created_at,
        ref_user.name as referred_by_name,
        ref_user.id as referred_by_user_id,
        -- Courses progress
        json_agg(
          json_build_object(
            'course_id', co.id,
            'course_title', co.title,
            'progress', cc.progress,
            'completed', cc.completed,
            'completed_at', cc.completed_at
          ) ORDER BY co.title
        ) as courses
      FROM candidates c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users ref_user ON c.referred_by_id = ref_user.id
      LEFT JOIN candidate_courses cc ON c.id = cc.candidate_id
      LEFT JOIN courses co ON cc.course_id = co.id
      GROUP BY c.id, u.id, ref_user.id
      ORDER BY c.created_at DESC
    `;
    const result = await pool.query(query);
    res.json({ candidates: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6d. Generate certificate for a candidate-course (admin)
app.post('/api/admin/generate-certificate', async (req, res) => {
  const { candidateId, courseId } = req.body;
  try {
    // Verify admin
    const adminEmail = req.headers['x-admin-email'];
    const adminCheck = await pool.query('SELECT default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()]);
    if (adminCheck.rows.length === 0 || (adminCheck.rows[0].default_role !== 'super_admin' && adminCheck.rows[0].default_role !== 'sourcing_head')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Check if candidate-course enrollment exists and is completed
    const enrollCheck = await pool.query(`
      SELECT cc.*, u.name as candidate_name, co.title as course_title, co.instructor
      FROM candidate_courses cc
      JOIN candidates c ON cc.candidate_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN courses co ON cc.course_id = co.id
      WHERE cc.candidate_id = $1 AND cc.course_id = $2
    `, [candidateId, courseId]);

    if (enrollCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not enrolled in this course' });
    }
    const enrollment = enrollCheck.rows[0];
    if (!enrollment.completed) {
      return res.status(400).json({ error: 'Course not completed yet' });
    }

    const studentName = enrollment.candidate_name;
    const courseTitle = enrollment.course_title;
    const certificateId = `CERT-${candidateId}-${courseId}-${Date.now().toString().slice(-6)}`;
    const issueDate = enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    res.json({
      success: true,
      studentName,
      courseTitle,
      issueDate,
      certificateId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6e. Enroll candidate in a course (admin or self)
app.post('/api/candidates/enroll-course', async (req, res) => {
  const { candidateId, courseId } = req.body;
  try {
    // Check if already enrolled
    const exist = await pool.query('SELECT id FROM candidate_courses WHERE candidate_id = $1 AND course_id = $2', [candidateId, courseId]);
    if (exist.rows.length > 0) {
      return res.status(400).json({ error: 'Already enrolled' });
    }
    const insert = await pool.query(
      'INSERT INTO candidate_courses (candidate_id, course_id) VALUES ($1, $2) RETURNING *',
      [candidateId, courseId]
    );
    res.status(201).json({ enrollment: insert.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6f. Update course progress (admin)
app.put('/api/candidates/course-progress', async (req, res) => {
  const { candidateId, courseId, progress, completed } = req.body;
  try {
    const update = await pool.query(
      `UPDATE candidate_courses 
       SET progress = COALESCE($1, progress), 
           completed = COALESCE($2, completed),
           completed_at = CASE WHEN $2 = true THEN NOW() ELSE completed_at END
       WHERE candidate_id = $3 AND course_id = $4
       RETURNING *`,
      [progress, completed, candidateId, courseId]
    );
    if (update.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    res.json({ enrollment: update.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. SUPPORT TICKET SYSTEM
// ==========================================

// Helper: verify admin access
async function isAdminUser(email) {
  if (!email) return false;
  const res = await pool.query(
    `SELECT id FROM users WHERE email = $1 AND default_role IN ('super_admin', 'sourcing_head', 'recruiter')`,
    [email.toLowerCase().trim()]
  );
  return res.rows.length > 0;
}

// 7a. Candidate: Create a new support ticket
app.post('/api/candidates/tickets', async (req, res) => {
  const { email, subject, message } = req.body;
  if (!email || !message) return res.status(400).json({ error: 'Email and message are required' });
  try {
    const userRes = await pool.query('SELECT id, name FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const userId = userRes.rows[0].id;
    const userName = userRes.rows[0].name;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const ticketRes = await client.query(
        `INSERT INTO support_tickets (user_id, subject) VALUES ($1, $2) RETURNING id`,
        [userId, subject?.trim() || 'General Support']
      );
      const ticketId = ticketRes.rows[0].id;
      // First message (from candidate)
      const adminRes = await client.query(`SELECT id FROM users WHERE default_role IN ('super_admin', 'sourcing_head') ORDER BY id ASC LIMIT 1`);
      const recipientId = adminRes.rows[0]?.id || null;
      await client.query(
        `INSERT INTO support_chats (ticket_id, sender_id, recipient_id, message, sender_name) VALUES ($1, $2, $3, $4, $5)`,
        [ticketId, userId, recipientId, message, userName]
      );
      await client.query('COMMIT');
      res.status(201).json({ ticketId, status: 'open' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7b. Candidate: Get all tickets for the logged-in candidate
app.get('/api/candidates/tickets', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const userId = userRes.rows[0].id;
    const tickets = await pool.query(`
      SELECT t.*,
        (SELECT COUNT(*) FROM support_chats WHERE ticket_id = t.id AND sender_id != $1) as admin_replies
      FROM support_tickets t
      WHERE t.user_id = $1
      ORDER BY t.updated_at DESC
    `, [userId]);
    res.json({ tickets: tickets.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7c. Get messages for a specific ticket (candidate or admin)
app.get('/api/tickets/:ticketId/messages', async (req, res) => {
  const { ticketId } = req.params;
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const userRes = await pool.query('SELECT id, default_role FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const userId = userRes.rows[0].id;
    const role = userRes.rows[0].default_role;
    const isAdmin = ['super_admin', 'sourcing_head', 'recruiter'].includes(role);

    if (!isAdmin) {
      const ticketCheck = await pool.query('SELECT user_id FROM support_tickets WHERE id = $1', [ticketId]);
      if (ticketCheck.rows.length === 0 || ticketCheck.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    const messages = await pool.query(`
      SELECT sc.*, u.name as sender_name_db, u.default_role as sender_role
      FROM support_chats sc
      LEFT JOIN users u ON sc.sender_id = u.id
      WHERE sc.ticket_id = $1
      ORDER BY sc.created_at ASC
    `, [ticketId]);
    res.json({ messages: messages.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7d. Post a message to a ticket (candidate or admin)
app.post('/api/tickets/:ticketId/messages', async (req, res) => {
  const { ticketId } = req.params;
  const { email, message, isAdmin } = req.body;
  if (!email || !message) return res.status(400).json({ error: 'Email and message required' });
  try {
    const userRes = await pool.query('SELECT id, name, default_role FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const userId = userRes.rows[0].id;
    const userName = userRes.rows[0].name;

    const ticketRes = await pool.query('SELECT user_id, status FROM support_tickets WHERE id = $1', [ticketId]);
    if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    const ticket = ticketRes.rows[0];
    if (ticket.status === 'closed') return res.status(400).json({ error: 'Ticket is closed' });

    let recipientId = null;
    let senderName = userName;

    if (isAdmin) {
      recipientId = ticket.user_id;
      senderName = 'Admin: ' + userName;
    } else {
      if (ticket.user_id !== userId) return res.status(403).json({ error: 'Access denied' });
      const adminRes = await pool.query(`SELECT id FROM users WHERE default_role IN ('super_admin', 'sourcing_head') ORDER BY id ASC LIMIT 1`);
      recipientId = adminRes.rows[0]?.id || null;
    }

    const insert = await pool.query(
      `INSERT INTO support_chats (ticket_id, sender_id, recipient_id, message, sender_name) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ticketId, userId, recipientId, message, senderName]
    );
    await pool.query('UPDATE support_tickets SET updated_at = NOW() WHERE id = $1', [ticketId]);
    res.status(201).json({ message: insert.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7e. Admin: Get all tickets with user info and last message
app.get('/api/admin/tickets', async (req, res) => {
  const adminEmail = req.headers['x-admin-email'];
  if (!adminEmail || !(await isAdminUser(adminEmail))) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const result = await pool.query(`
      SELECT
        t.*,
        u.name as user_name,
        u.email as user_email,
        (SELECT message FROM support_chats WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM support_chats WHERE ticket_id = t.id AND sender_id != t.user_id) as admin_replies
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.updated_at DESC
    `);
    res.json({ tickets: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7f. Admin: Close a ticket
app.post('/api/admin/tickets/:ticketId/close', async (req, res) => {
  const { ticketId } = req.params;
  const adminEmail = req.headers['x-admin-email'];
  if (!adminEmail || !(await isAdminUser(adminEmail))) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    await pool.query(`UPDATE support_tickets SET status = 'closed', updated_at = NOW() WHERE id = $1`, [ticketId]);
    res.json({ message: 'Ticket closed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7g. Admin: Reopen a ticket
app.post('/api/admin/tickets/:ticketId/reopen', async (req, res) => {
  const { ticketId } = req.params;
  const adminEmail = req.headers['x-admin-email'];
  if (!adminEmail || !(await isAdminUser(adminEmail))) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    await pool.query(`UPDATE support_tickets SET status = 'open', updated_at = NOW() WHERE id = $1`, [ticketId]);
    res.json({ message: 'Ticket reopened' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SERVE FRONTEND ====================

// Serve static files from the built frontend
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))

// All other routes serve the SPA
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`\n◇ TSPL CRM Production Server running on port ${PORT}`)
  console.log(`◇ Frontend: http://localhost:${PORT}`)
  console.log(`◇ API Base: http://localhost:${PORT}/api/`)
  console.log(`◇ SMTP Delivery: ${process.env.SMTP_USER ? `Configured ✓ (${process.env.SMTP_HOST || 'smtp.gmail.com'})` : 'Not configured'}`)
  console.log(`◇ Mail Fallback: ${!process.env.SMTP_USER ? 'Mock Console Mode ⚠️' : 'Active Delivery ✓'}\n`)
})