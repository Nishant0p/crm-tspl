import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pg from 'pg'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

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
  } catch (e) {
    console.error("Failed to initialize database pool:", e.message)
  }
} else {
  console.warn("⚠️ DATABASE_URL not found in .env file.")
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Mailer: Send Mail via Resend REST API
async function sendMailViaResend(email, subject, htmlContent) {
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    return false
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'TSPL Platform <noreply@tspl.nishant.codes>',
        to: [email],
        subject: subject,
        html: htmlContent
      })
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Resend HTTP delivery failure')
    }
    console.log(`◇ Email successfully dispatched via Resend API to ${email} (ID: ${data.id})`)
    return true
  } catch (err) {
    console.error('Resend API delivery failed:', err.message)
    return false
  }
}

// Mailer: Send Welcome HTML Email
async function sendWelcomeEmail(email, name) {
  const html = `
    <div style="background-color: #F8F9FA; padding: 40px 20px; font-family: 'Inter', Arial, sans-serif;">
      <div style="background-color: #FFFFFF; color: #111111; padding: 40px; text-align: center; border: 1px solid #E4E4E4; border-radius: 12px; max-width: 550px; margin: 0 auto; box-shadow: 0 4px 24px rgba(10, 10, 10, 0.06);">
        <div style="font-size: 28px; font-weight: 800; color: #000000; margin-bottom: 24px; letter-spacing: 1.5px; text-transform: uppercase;">
          TSPL <span style="color: #F81927;">PLATFORM</span>
        </div>
        <div style="border-top: 1px solid #E4E4E4; margin-bottom: 24px;"></div>
        <h2 style="color: #111111; font-size: 22px; margin-top: 0; margin-bottom: 16px; font-weight: 700; letter-spacing: -0.5px;">
          Welcome Aboard, ${name}!
        </h2>
        <p style="color: #5F5F5F; font-size: 15px; line-height: 1.6; margin-bottom: 28px; text-align: left;">
          Hello <strong style="color: #111111;">${name}</strong>,<br>
          Your enterprise profile has been successfully registered. You now have full access to our Unified Sourcing, Job Placements, and Skill Ecosystem.
        </p>
        <div style="background-color: #FFFFFF; border: 1px solid #E4E4E4; padding: 12px 24px; border-radius: 6px; display: inline-block; margin-bottom: 28px;">
          <span style="color: #F81927; font-weight: bold; font-size: 14px; letter-spacing: 0.5px;">Candidate Profile Verified ✓</span>
        </div>
        <div style="border-top: 1px solid #E4E4E4; margin-bottom: 20px;"></div>
        <p style="color: #8A8A8A; font-size: 11px; margin: 0; line-height: 1.4;">
          This is an automated notification from TSPL Academic Registry.<br>
          &copy; 2026 TSPL. All internal automation systems apply.
        </p>
      </div>
    </div>
  `
  const resendConfigured = !!process.env.RESEND_API_KEY
  if (resendConfigured) {
    return await sendMailViaResend(email, 'Welcome to TSPL Platform!', html)
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
    <div style="background-color: #F8F9FA; padding: 40px 20px; font-family: 'Inter', Arial, sans-serif;">
      <div style="background-color: #FFFFFF; color: #111111; padding: 40px; text-align: center; border: 1px solid #E4E4E4; border-radius: 12px; max-width: 550px; margin: 0 auto; box-shadow: 0 4px 24px rgba(10, 10, 10, 0.06);">
        <div style="font-size: 28px; font-weight: 800; color: #000000; margin-bottom: 24px; letter-spacing: 1.5px; text-transform: uppercase;">
          TSPL <span style="color: #F81927;">PLATFORM</span>
        </div>
        <div style="border-top: 1px solid #E4E4E4; margin-bottom: 24px;"></div>
        <h2 style="color: #111111; font-size: 22px; margin-top: 0; margin-bottom: 16px; font-weight: 700; letter-spacing: -0.5px;">
          ${title}
        </h2>
        <p style="color: #5F5F5F; font-size: 15px; line-height: 1.6; margin-bottom: 28px; text-align: left;">
          Hello <strong style="color: #111111;">${name}</strong>,<br>
          ${description}
        </p>
        <div style="background-color: #F81927; padding: 16px 40px; border-radius: 8px; display: inline-block; margin-bottom: 28px; box-shadow: 0 4px 12px rgba(248, 25, 39, 0.2);">
          <span style="font-size: 36px; font-weight: 800; color: #FFFFFF; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${otp}
          </span>
        </div>
        <p style="color: #5F5F5F; font-size: 13px; margin-bottom: 24px;">
          This security verification code will expire in <span style="color: #F81927; font-weight: 600;">${isSignup ? '10' : (isLogin ? '5' : '10')} minutes</span>.
        </p>
        <div style="border-top: 1px solid #E4E4E4; margin-bottom: 20px;"></div>
        <p style="color: #8A8A8A; font-size: 11px; margin: 0; line-height: 1.4;">
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

  const resendConfigured = !!process.env.RESEND_API_KEY
  if (resendConfigured) {
    const success = await sendMailViaResend(email, subject, html)
    if (!success) {
      console.log(`⚠️ Resend email delivery failed for ${email}. Please copy the OTP from the console log above.`)
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
      if (result.rows.length === 0) {
        const passHash = hashPassword(superAdminPassword)
        await pool.query(
          'INSERT INTO users (email, password_hash, name, default_role) VALUES ($1, $2, $3, $4)',
          [superAdminEmail.toLowerCase().trim(), passHash, 'System Super Admin', 'super_admin']
        )
        console.log(`◇ Automatically provisioned default Super Admin account: ${superAdminEmail}`)
      } else {
        const existing = result.rows[0]
        if (existing.default_role !== 'super_admin') {
          await pool.query(
            'UPDATE users SET default_role = $1 WHERE email = $2',
            ['super_admin', superAdminEmail.toLowerCase().trim()]
          )
          console.log(`◇ Adjusted user role to super_admin for: ${superAdminEmail}`)
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

// ==================== SERVE FRONTEND ====================

// Serve static files from the built frontend
const distPath = path.join(__dirname, 'dist')
app.use(express.static(distPath))

// All other routes serve the SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`\n◇ TSPL CRM Production Server running on port ${PORT}`)
  console.log(`◇ Frontend: http://localhost:${PORT}`)
  console.log(`◇ API Base: http://localhost:${PORT}/api/`)
  console.log(`◇ Resend API: ${process.env.RESEND_API_KEY ? 'Configured ✓' : 'Not configured (console fallback)'}\n`)
})
