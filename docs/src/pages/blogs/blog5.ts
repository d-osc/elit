import { div, h2, h3, h4, p, ul, li, pre, code } from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog5: BlogPostDetail = {
  id: '5',
  title: {
    en: 'Security Best Practices with Elit',
    th: 'แนวทางปฏิบัติด้านความปลอดภัยกับ Elit'
  },
  date: '2024-02-15',
  author: 'n-devs',
  tags: ['Security', 'Best Practices', 'XSS', 'CSRF'],
  content: {
    en: div(
      p('Building secure web applications is critical. Learn how Elit helps you create secure applications and what best practices you should follow.'),

      h2('Built-in Security Features'),

      h3('1. Automatic Text Escaping'),
      p('Elit automatically escapes text content to prevent XSS attacks:'),
      pre(code(...codeBlock(`const userInput = '<script>alert("XSS")</script>';
const safe = div(userInput); // Rendered as text, not executed

// Output: <div>&lt;script&gt;alert("XSS")&lt;/script&gt;</div>`))),

      h3('2. No innerHTML by Default'),
      p('Unlike vanilla JavaScript, Elit doesn\'t use innerHTML, reducing XSS risks:'),
      pre(code(...codeBlock(`// Elit (Safe)
div(userContent); // Always escaped

// Vanilla JS (Dangerous)
element.innerHTML = userContent; // Can execute scripts`))),

      h3('3. Attribute Sanitization'),
      p('Dangerous attributes are handled carefully:'),
      pre(code(...codeBlock(`// Event handlers are functions, not strings
button({ onclick: handleClick }, 'Click me'); // Safe

// Not string-based inline handlers
// onclick="maliciousCode()" // NOT used in Elit`))),

      h2('Common Security Vulnerabilities'),

      h3('Cross-Site Scripting (XSS)'),
      p('XSS occurs when untrusted data is included in web pages without proper validation. Elit\'s default behavior helps prevent this:'),

      h4('✓ Safe Practices:'),
      pre(code(...codeBlock(`// User input is automatically escaped
const comment = createState('');
div(
  input({
    type: 'text',
    onchange: (e) => comment.value = e.target.value
  }),
  reactive(comment, value =>
    div({ className: 'comment' }, value) // Escaped automatically
  )
);`))),

      h4('✗ Unsafe Practices to Avoid:'),
      pre(code(...codeBlock(`// DON'T manually set innerHTML
const element = div();
element.node.innerHTML = userInput; // DANGEROUS!

// DON'T use eval or Function constructor
eval(userCode); // NEVER DO THIS
new Function(userCode)(); // NEVER DO THIS`))),

      h3('Cross-Site Request Forgery (CSRF)'),
      p('Protect your forms with CSRF tokens:'),
      pre(code(...codeBlock(`// Include CSRF token in forms
const csrfToken = getCsrfToken(); // From your backend

form({
  method: 'POST',
  action: '/api/update',
  onsubmit: async (e) => {
    e.preventDefault();
    await fetch('/api/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(formData)
    });
  }
},
  input({ type: 'hidden', name: 'csrf_token', value: csrfToken }),
  // ... other form fields
);`))),

      h3('Content Security Policy (CSP)'),
      p('Use CSP headers to restrict resource loading:'),
      pre(code(...codeBlock(`// Add CSP meta tag
import { addMeta } from 'elit';

addMeta({
  'http-equiv': 'Content-Security-Policy',
  content: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
});`))),

      h2('Input Validation and Sanitization'),

      h3('Validate User Input'),
      pre(code(...codeBlock(`const email = createState('');
const isValid = computed(() =>
  /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.value)
);

form(
  input({
    type: 'email',
    onchange: (e) => email.value = e.target.value
  }),
  reactive(isValid, valid =>
    !valid && email.value
      ? span({ className: 'error' }, 'Invalid email format')
      : null
  )
);`))),

      h3('Sanitize Data Before Display'),
      pre(code(...codeBlock(`// Create a sanitization helper
function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// Use it for user content
const userBio = sanitizeHtml(rawUserBio);
div(userBio);`))),

      h2('Secure State Management'),

      h3('Don\'t Store Sensitive Data in State'),
      pre(code(...codeBlock(`// ✗ BAD - Sensitive data in client state
const password = createState('user-password');
const apiKey = createState('secret-key');

// ✓ GOOD - Handle sensitive data server-side
const sessionToken = createState(null);

async function login(username, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  const { token } = await response.json();
  sessionToken.value = token; // Store only session token
}`))),

      h3('Use Secure HTTP-Only Cookies'),
      p('Store authentication tokens in HTTP-only cookies, not localStorage:'),
      pre(code(...codeBlock(`// Backend should set HTTP-only cookie
// Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Strict

// In Elit, just make authenticated requests
async function fetchUserData() {
  const response = await fetch('/api/user', {
    credentials: 'include' // Send cookies
  });
  return response.json();
}`))),

      h2('Preventing Injection Attacks'),

      h3('SQL Injection Prevention'),
      p('Always use parameterized queries on the backend:'),
      pre(code(...codeBlock(`// ✗ BAD - Backend vulnerable to SQL injection
// query = "SELECT * FROM users WHERE id = " + userId;

// ✓ GOOD - Use parameterized queries (backend)
// query = "SELECT * FROM users WHERE id = ?", [userId]

// In Elit, validate input before sending
const userId = createState('');

async function fetchUser() {
  if (!/^\\d+$/.test(userId.value)) {
    console.error('Invalid user ID');
    return;
  }

  const response = await fetch(\`/api/users/\${userId.value}\`);
  return response.json();
}`))),

      h2('Secure Routing'),

      h3('Validate Route Parameters'),
      pre(code(...codeBlock(`// Validate blog ID before rendering
export const BlogDetailPage = (router: Router, blogId: string) => {
  // Validate ID format
  if (!/^[1-9]\\d*$/.test(blogId)) {
    return div('Invalid blog ID');
  }

  const post = blogPostsDetail.find(p => p.id === blogId);

  if (!post) {
    return div('Blog post not found');
  }

  // ... render post
};`))),

      h2('Third-Party Dependencies'),

      h3('Elit\'s Zero-Dependency Advantage'),
      p('Elit has ZERO dependencies, eliminating supply chain attack risks:'),
      ul(
        li('No npm packages to audit'),
        li('No transitive dependencies'),
        li('Reduced attack surface'),
        li('Full control over your codebase')
      ),

      h3('When Adding Dependencies'),
      p('If you must add dependencies, follow these practices:'),
      ul(
        li('Audit packages with npm audit'),
        li('Check package reputation and maintenance'),
        li('Review package code before installing'),
        li('Use lock files (package-lock.json)'),
        li('Keep dependencies updated')
      ),

      h2('Security Checklist'),
      ul(
        li('✓ Never use eval() or new Function() with user input'),
        li('✓ Always validate and sanitize user input'),
        li('✓ Use HTTPS for all production deployments'),
        li('✓ Implement CSRF protection for state-changing operations'),
        li('✓ Set appropriate Content Security Policy headers'),
        li('✓ Store sensitive data server-side, not client-side'),
        li('✓ Use HTTP-only cookies for authentication'),
        li('✓ Validate all route parameters and API inputs'),
        li('✓ Keep Elit and dependencies updated'),
        li('✓ Regular security audits and penetration testing')
      ),

      h2('Conclusion'),
      p('Elit\'s design philosophy prioritizes security through automatic text escaping, no innerHTML usage, and zero dependencies. By following these best practices, you can build secure applications that protect your users and data.'),
      p('Remember: security is not a feature, it\'s a continuous process. Stay informed about security vulnerabilities and keep your applications updated.')
    ),
    th: div(
      p('การสร้างเว็บแอปพลิเคชันที่ปลอดภัยเป็นสิ่งสำคัญ เรียนรู้ว่า Elit ช่วยคุณสร้างแอปพลิเคชันที่ปลอดภัยได้อย่างไร และแนวทางปฏิบัติที่ดีที่คุณควรทำตาม'),

      h2('คุณสมบัติความปลอดภัยในตัว'),

      h3('1. การ Escape ข้อความอัตโนมัติ'),
      p('Elit จะ escape เนื้อหาข้อความอัตโนมัติเพื่อป้องกันการโจมตีแบบ XSS:'),
      pre(code(...codeBlock(`const userInput = '<script>alert("XSS")</script>';
const safe = div(userInput); // แสดงเป็นข้อความ ไม่ถูกรันโค้ด

// Output: <div>&lt;script&gt;alert("XSS")&lt;/script&gt;</div>`))),

      h3('2. ไม่ใช้ innerHTML โดยปริยาย'),
      p('ต่างจาก vanilla JavaScript, Elit ไม่ใช้ innerHTML ทำให้ลดความเสี่ยงจาก XSS:'),
      pre(code(...codeBlock(`// Elit (ปลอดภัย)
div(userContent); // Escape เสมอ

// Vanilla JS (อันตราย)
element.innerHTML = userContent; // อาจรันสคริปต์ได้`))),

      h3('3. การตรวจสอบ Attribute'),
      p('Attributes ที่อันตรายได้รับการจัดการอย่างระมัดระวัง:'),
      pre(code(...codeBlock(`// Event handlers เป็น functions ไม่ใช่ strings
button({ onclick: handleClick }, 'คลิกฉัน'); // ปลอดภัย

// ไม่ใช้ inline handlers แบบ string
// onclick="maliciousCode()" // ไม่ได้ใช้ใน Elit`))),

      h2('ช่องโหว่ด้านความปลอดภัยทั่วไป'),

      h3('Cross-Site Scripting (XSS)'),
      p('XSS เกิดขึ้นเมื่อข้อมูลที่ไม่น่าเชื่อถือถูกรวมในหน้าเว็บโดยไม่มีการตรวจสอบที่เหมาะสม พฤติกรรมเริ่มต้นของ Elit ช่วยป้องกันสิ่งนี้:'),

      h4('✓ แนวทางที่ปลอดภัย:'),
      pre(code(...codeBlock(`// Input จากผู้ใช้จะถูก escape อัตโนมัติ
const comment = createState('');
div(
  input({
    type: 'text',
    onchange: (e) => comment.value = e.target.value
  }),
  reactive(comment, value =>
    div({ className: 'comment' }, value) // Escape อัตโนมัติ
  )
);`))),

      h4('✗ แนวทางที่ไม่ปลอดภัยที่ควรหลีกเลี่ยง:'),
      pre(code(...codeBlock(`// อย่าตั้งค่า innerHTML ด้วยตนเอง
const element = div();
element.node.innerHTML = userInput; // อันตราย!

// อย่าใช้ eval หรือ Function constructor
eval(userCode); // ห้ามทำเด็ดขาด
new Function(userCode)(); // ห้ามทำเด็ดขาด`))),

      h3('Cross-Site Request Forgery (CSRF)'),
      p('ป้องกันฟอร์มด้วย CSRF tokens:'),
      pre(code(...codeBlock(`// รวม CSRF token ในฟอร์ม
const csrfToken = getCsrfToken(); // จาก backend

form({
  method: 'POST',
  action: '/api/update',
  onsubmit: async (e) => {
    e.preventDefault();
    await fetch('/api/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(formData)
    });
  }
},
  input({ type: 'hidden', name: 'csrf_token', value: csrfToken }),
  // ... ฟิลด์ฟอร์มอื่นๆ
);`))),

      h3('Content Security Policy (CSP)'),
      p('ใช้ CSP headers เพื่อจำกัดการโหลดทรัพยากร:'),
      pre(code(...codeBlock(`// เพิ่ม CSP meta tag
import { addMeta } from 'elit';

addMeta({
  'http-equiv': 'Content-Security-Policy',
  content: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
});`))),

      h2('การตรวจสอบและทำความสะอาด Input'),

      h3('ตรวจสอบ Input จากผู้ใช้'),
      pre(code(...codeBlock(`const email = createState('');
const isValid = computed(() =>
  /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.value)
);

form(
  input({
    type: 'email',
    onchange: (e) => email.value = e.target.value
  }),
  reactive(isValid, valid =>
    !valid && email.value
      ? span({ className: 'error' }, 'รูปแบบอีเมลไม่ถูกต้อง')
      : null
  )
);`))),

      h3('ทำความสะอาดข้อมูลก่อนแสดงผล'),
      pre(code(...codeBlock(`// สร้าง helper สำหรับทำความสะอาด
function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// ใช้กับเนื้อหาจากผู้ใช้
const userBio = sanitizeHtml(rawUserBio);
div(userBio);`))),

      h2('การจัดการ State อย่างปลอดภัย'),

      h3('อย่าเก็บข้อมูลที่ละเอียดอ่อนใน State'),
      pre(code(...codeBlock(`// ✗ ไม่ดี - ข้อมูลละเอียดอ่อนใน client state
const password = createState('user-password');
const apiKey = createState('secret-key');

// ✓ ดี - จัดการข้อมูลละเอียดอ่อนฝั่ง server
const sessionToken = createState(null);

async function login(username, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  const { token } = await response.json();
  sessionToken.value = token; // เก็บเฉพาะ session token
}`))),

      h3('ใช้ HTTP-Only Cookies ที่ปลอดภัย'),
      p('เก็บ authentication tokens ใน HTTP-only cookies ไม่ใช่ localStorage:'),
      pre(code(...codeBlock(`// Backend ควรตั้ง HTTP-only cookie
// Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Strict

// ใน Elit แค่ส่ง authenticated requests
async function fetchUserData() {
  const response = await fetch('/api/user', {
    credentials: 'include' // ส่ง cookies
  });
  return response.json();
}`))),

      h2('การป้องกันการโจมตีแบบ Injection'),

      h3('การป้องกัน SQL Injection'),
      p('ใช้ parameterized queries บน backend เสมอ:'),
      pre(code(...codeBlock(`// ✗ ไม่ดี - Backend เสี่ยงต่อ SQL injection
// query = "SELECT * FROM users WHERE id = " + userId;

// ✓ ดี - ใช้ parameterized queries (backend)
// query = "SELECT * FROM users WHERE id = ?", [userId]

// ใน Elit ตรวจสอบ input ก่อนส่ง
const userId = createState('');

async function fetchUser() {
  if (!/^\\d+$/.test(userId.value)) {
    console.error('User ID ไม่ถูกต้อง');
    return;
  }

  const response = await fetch(\`/api/users/\${userId.value}\`);
  return response.json();
}`))),

      h2('Routing ที่ปลอดภัย'),

      h3('ตรวจสอบ Route Parameters'),
      pre(code(...codeBlock(`// ตรวจสอบ blog ID ก่อน render
export const BlogDetailPage = (router: Router, blogId: string) => {
  // ตรวจสอบรูปแบบ ID
  if (!/^[1-9]\\d*$/.test(blogId)) {
    return div('Blog ID ไม่ถูกต้อง');
  }

  const post = blogPostsDetail.find(p => p.id === blogId);

  if (!post) {
    return div('ไม่พบบล็อกโพสต์');
  }

  // ... render post
};`))),

      h2('Dependencies จากภายนอก'),

      h3('ข้อได้เปรียบของ Elit ที่ Zero-Dependency'),
      p('Elit ไม่มี dependencies เลย ขจัดความเสี่ยงจากการโจมตี supply chain:'),
      ul(
        li('ไม่มี npm packages ที่ต้อง audit'),
        li('ไม่มี transitive dependencies'),
        li('พื้นที่โจมตีลดลง'),
        li('ควบคุม codebase ได้เต็มที่')
      ),

      h3('เมื่อต้องเพิ่ม Dependencies'),
      p('หากต้องเพิ่ม dependencies ปฏิบัติตามแนวทางเหล่านี้:'),
      ul(
        li('Audit packages ด้วย npm audit'),
        li('ตรวจสอบชื่อเสียงและการดูแลรักษา package'),
        li('ตรวจสอบโค้ดของ package ก่อนติดตั้ง'),
        li('ใช้ lock files (package-lock.json)'),
        li('อัปเดต dependencies เป็นประจำ')
      ),

      h2('รายการตรวจสอบความปลอดภัย'),
      ul(
        li('✓ อย่าใช้ eval() หรือ new Function() กับ user input'),
        li('✓ ตรวจสอบและทำความสะอาด user input เสมอ'),
        li('✓ ใช้ HTTPS สำหรับการ deploy production ทั้งหมด'),
        li('✓ ใช้การป้องกัน CSRF สำหรับการดำเนินการที่เปลี่ยน state'),
        li('✓ ตั้งค่า Content Security Policy headers ที่เหมาะสม'),
        li('✓ เก็บข้อมูลละเอียดอ่อนฝั่ง server ไม่ใช่ client'),
        li('✓ ใช้ HTTP-only cookies สำหรับ authentication'),
        li('✓ ตรวจสอบ route parameters และ API inputs ทั้งหมด'),
        li('✓ อัปเดต Elit และ dependencies เป็นประจำ'),
        li('✓ ตรวจสอบความปลอดภัยและทดสอบเจาะระบบเป็นประจำ')
      ),

      h2('สรุป'),
      p('ปรัชญาการออกแบบของ Elit ให้ความสำคัญกับความปลอดภัยผ่านการ escape ข้อความอัตโนมัติ ไม่ใช้ innerHTML และไม่มี dependencies ด้วยการปฏิบัติตามแนวทางที่ดีเหล่านี้ คุณสามารถสร้างแอปพลิเคชันที่ปลอดภัยซึ่งปกป้องผู้ใช้และข้อมูลของคุณ'),
      p('จำไว้ว่า: ความปลอดภัยไม่ใช่คุณสมบัติ แต่เป็นกระบวนการต่อเนื่อง ติดตามข้อมูลเกี่ยวกับช่องโหว่ด้านความปลอดภัยและอัปเดตแอปพลิเคชันของคุณเป็นประจำ')
    )
  }
};
