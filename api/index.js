import pg from 'pg'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const { Pool } = pg

// Setup PostgreSQL pool (reuse across invocations)
let pool
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5
    })
  }
  return pool
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

// Mailer: Send OTP Email
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
          Hello <strong style="color: #1E3A8A;">${name}</strong>,<br>${description}
        </p>
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="background-color: #F97316; padding: 16px 40px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);">
            <span style="font-size: 36px; font-weight: 800; color: #FFFFFF; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
          </div>
        </div>
        <p style="color: #475569; font-size: 13px; margin-bottom: 24px; text-align: center;">
          This code will expire in <span style="color: #2563EB; font-weight: 600;">${isSignup ? '10' : (isLogin ? '5' : '10')} minutes</span>.
        </p>
        <div style="border-top: 1px solid #DBEAFE; margin-bottom: 20px;"></div>
        <p style="color: #94A3B8; font-size: 11px; margin: 0; text-align: center;">&copy; 2026 TSPL. All internal automation systems apply.</p>
      </div>
    </div>
  `

  console.log(`[OTP - ${type.toUpperCase()}] To: ${email} | Code: ${otp}`)

  const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS)
  if (smtpConfigured) {
    const success = await sendMailViaSMTP(email, subject, html)
    if (!success) console.log(`⚠️ SMTP failed for ${email}`)
  }
  return true
}

// Auto-provision Super Admin (runs once per cold start)
let superAdminProvisioned = false
async function provisionSuperAdmin(dbPool) {
  if (superAdminProvisioned) return
  superAdminProvisioned = true
  const email = process.env.SUPER_ADMIN_EMAIL
  const password = process.env.SUPER_ADMIN_PASSWORD
  if (!email || !password) return
  try {
    const result = await dbPool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()])
    if (result.rows.length === 0) {
      const passHash = hashPassword(password)
      await dbPool.query(
        'INSERT INTO users (email, password_hash, name, default_role) VALUES ($1, $2, $3, $4)',
        [email.toLowerCase().trim(), passHash, 'System Super Admin', 'super_admin']
      )
    } else if (result.rows[0].default_role !== 'super_admin') {
      await dbPool.query('UPDATE users SET default_role = $1 WHERE email = $2', ['super_admin', email.toLowerCase().trim()])
    }
  } catch (err) {
    console.error('Super admin provision error:', err.message)
  }
}

// ==================== SERVERLESS HANDLER ====================
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Email')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const dbPool = getPool()
  if (!dbPool) {
    return res.status(500).json({ error: 'Database not configured. Set DATABASE_URL environment variable.' })
  }

  // Auto-provision super admin on first request
  await provisionSuperAdmin(dbPool)

  // Parse the route: /api/auth/register -> ['', 'api', 'auth', 'register']
  const url = new URL(req.url, `https://${req.headers.host}`)
  const pathname = url.pathname
  const body = req.body || {}

  try {
    // ---- POST /api/auth/register ----
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      const { email, password, name } = body
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'All fields are required' })
      }
      const passHash = hashPassword(password)

      const result = await dbPool.query(
        'INSERT INTO users (email, password_hash, name, default_role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, default_role',
        [email.toLowerCase().trim(), passHash, name.trim(), 'candidate']
      )
      const user = result.rows[0]

      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await dbPool.query(
        'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at',
        [email.toLowerCase().trim(), otp, expiresAt]
      )
      await sendOTPEmail(email.toLowerCase().trim(), name.trim(), otp, 'signup')

      return res.status(201).json({
        message: 'Account created! A verification code has been sent to your email.',
        otp_required: true,
        email: email.toLowerCase().trim(),
        user
      })
    }

    // ---- POST /api/auth/login ----
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = body
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
      }
      const result = await dbPool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()])
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid email or password credentials' })
      }
      const user = result.rows[0]
      if (user.password_hash !== hashPassword(password)) {
        return res.status(400).json({ error: 'Invalid email or password credentials' })
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
      await dbPool.query(
        'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at',
        [email.toLowerCase().trim(), otp, expiresAt]
      )
      await sendOTPEmail(email.toLowerCase().trim(), user.name, otp, 'login')

      return res.status(200).json({
        message: 'Secure OTP code dispatched to your registered email.',
        otp_required: true,
        email: email.toLowerCase().trim()
      })
    }

    // ---- POST /api/auth/verify-otp ----
    if (pathname === '/api/auth/verify-otp' && req.method === 'POST') {
      const { email, otp } = body
      if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP code are required' })
      }
      const result = await dbPool.query('SELECT * FROM otps WHERE email = $1', [email.toLowerCase().trim()])
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

      await dbPool.query('DELETE FROM otps WHERE email = $1', [email.toLowerCase().trim()])
      const userResult = await dbPool.query('SELECT id, email, name, default_role FROM users WHERE email = $1', [email.toLowerCase().trim()])

      return res.status(200).json({
        message: 'Identity confirmed successfully.',
        user: userResult.rows[0]
      })
    }

    // ---- POST /api/auth/request-reset ----
    if (pathname === '/api/auth/request-reset' && req.method === 'POST') {
      const { email } = body
      if (!email) {
        return res.status(400).json({ error: 'Email address is required' })
      }
      const result = await dbPool.query('SELECT name FROM users WHERE email = $1', [email.toLowerCase().trim()])
      if (result.rows.length === 0) {
        return res.status(200).json({ message: 'If the email is registered, a password reset code has been sent.' })
      }
      const name = result.rows[0].name
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await dbPool.query(
        'INSERT INTO otps (email, otp_code, expires_at) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at',
        [email.toLowerCase().trim(), otp, expiresAt]
      )
      await sendOTPEmail(email.toLowerCase().trim(), name, otp, 'reset')

      return res.status(200).json({
        message: 'Reset verification code sent to your email.',
        email: email.toLowerCase().trim()
      })
    }

    // ---- POST /api/auth/reset-password ----
    if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
      const { email, otp, newPassword } = body
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'All fields are required' })
      }
      const result = await dbPool.query('SELECT * FROM otps WHERE email = $1', [email.toLowerCase().trim()])
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

      await dbPool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashPassword(newPassword), email.toLowerCase().trim()])
      await dbPool.query('DELETE FROM otps WHERE email = $1', [email.toLowerCase().trim()])

      return res.status(200).json({ message: 'Password updated successfully. You can now login.' })
    }

    // ---- POST /api/auth/me ----
    if (pathname === '/api/auth/me' && req.method === 'POST') {
      const { email } = body
      if (!email) {
        return res.status(401).json({ error: 'Authentication missing' })
      }
      const result = await dbPool.query('SELECT id, email, name, default_role FROM users WHERE email = $1', [email.toLowerCase().trim()])
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'User does not exist in register database' })
      }
      return res.status(200).json({ user: result.rows[0] })
    }

    // ---- GET /api/admin/users ----
    if (pathname === '/api/admin/users' && req.method === 'GET') {
      const adminEmail = req.headers['x-admin-email']
      if (!adminEmail) {
        return res.status(401).json({ error: 'Admin identifier not provided' })
      }
      const adminCheck = await dbPool.query('SELECT default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()])
      if (adminCheck.rows.length === 0 || adminCheck.rows[0].default_role !== 'super_admin') {
        return res.status(403).json({ error: 'Access restricted to system Super Admin' })
      }
      const result = await dbPool.query('SELECT id, email, name, default_role FROM users ORDER BY name ASC')
      return res.status(200).json({ users: result.rows })
    }

    // ---- POST /api/admin/update-role ----
    if (pathname === '/api/admin/update-role' && req.method === 'POST') {
      const adminEmail = req.headers['x-admin-email']
      const { userId, newRole } = body
      if (!adminEmail || !userId || !newRole) {
        return res.status(400).json({ error: 'Admin headers and parameters required' })
      }
      const adminCheck = await dbPool.query('SELECT default_role FROM users WHERE email = $1', [adminEmail.toLowerCase().trim()])
      if (adminCheck.rows.length === 0 || adminCheck.rows[0].default_role !== 'super_admin') {
        return res.status(403).json({ error: 'Access restricted to system Super Admin' })
      }
      await dbPool.query('UPDATE users SET default_role = $1 WHERE id = $2', [newRole, userId])
      return res.status(200).json({ message: 'User role updated successfully' })
    }

    // ---- 404 ----
    return res.status(404).json({ error: 'API endpoint not found' })

  } catch (error) {
    console.error('API Error:', error.message)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
