import {
  div, h1, h2, h3, p, ul, li, pre, code
} from 'elit';
import { codeBlock } from '../../highlight';
import type { BlogPostDetail } from '../blogContent';

export const blog14: BlogPostDetail = {
  id: '14',
  title: {
    en: 'Element Factories in Elit',
    th: 'Element Factories ใน Elit'
  },
  date: '2024-03-30',
  author: 'n-devs',
  tags: ['Tutorial', 'Elements', 'API', 'Basics'],
  content: {
    en: div(
      p('Learn how to use Elit\'s element factories to create DOM elements with a simple, functional API. This comprehensive guide covers HTML elements, SVG elements, MathML elements, props and attributes, children handling, and advanced patterns for building component-based UIs.'),

      h2('What are Element Factories?'),
      p('Element factories are functions that create VNode objects representing DOM elements. Elit provides 100+ element factories covering all standard HTML, SVG, and MathML elements. Each factory creates a lightweight VNode structure that can be rendered to the actual DOM.'),
      ul(
        li('Type-safe: Full TypeScript support with autocomplete'),
        li('Flexible API: Props optional, children optional, mix and match'),
        li('Zero overhead: Direct factory calls, no JSX compilation needed'),
        li('Complete coverage: HTML, SVG, MathML elements'),
        li('Intuitive: Simple function calls that feel natural')
      ),

      h2('Basic Element Creation'),
      h3('Simple Elements'),
      p('Create elements by calling factory functions:'),
      pre(code(...codeBlock(`import { div, p, span, h1 } from 'elit';

// Simple element with text
const heading = h1('Hello World');

// Element with multiple children
const paragraph = p(
  'This is ',
  span('important'),
  ' text.'
);

// Nested elements
const container = div(
  h1('Title'),
  p('Content here')
);

// Render to DOM
document.body.appendChild(container.node);`))),

      h3('Elements with Props'),
      p('Pass props as the first argument if it\'s an object:'),
      pre(code(...codeBlock(`import { div, button, input, a } from 'elit';

// Element with className
const card = div({ className: 'card' },
  'Card content'
);

// Element with multiple props
const link = a({
  href: 'https://example.com',
  target: '_blank',
  className: 'external-link'
}, 'Visit Example');

// Input with props
const textInput = input({
  type: 'text',
  placeholder: 'Enter name',
  value: '',
  className: 'form-input'
});

// Button with event handler
const btn = button({
  className: 'btn btn-primary',
  onclick: () => console.log('Clicked!')
}, 'Click Me');`))),

      h3('Empty Elements'),
      p('Call factories without arguments to create empty elements:'),
      pre(code(...codeBlock(`import { div, span, ul } from 'elit';

// Empty elements
const emptyDiv = div();
const emptySpan = span();
const emptyList = ul();

// Later add children dynamically
const container = div();
// ... manipulate container.node directly if needed`))),

      h2('Working with Props'),
      h3('Common Props'),
      p('Standard HTML attributes work as expected:'),
      pre(code(...codeBlock(`import { div, input, img, a } from 'elit';

// Class names
const box = div({ className: 'box large primary' });

// ID
const main = div({ id: 'main-content' });

// Data attributes
const widget = div({
  'data-id': '123',
  'data-type': 'widget'
});

// Aria attributes
const menu = div({
  role: 'menu',
  'aria-label': 'Main navigation'
});

// Image
const logo = img({
  src: '/logo.png',
  alt: 'Company Logo',
  width: '200',
  height: '100'
});

// Link
const navLink = a({
  href: '/about',
  title: 'About Us'
}, 'About');`))),

      h3('Inline Styles'),
      p('Use the style prop with string or object:'),
      pre(code(...codeBlock(`import { div, p } from 'elit';

// Style as string
const box1 = div({
  style: 'color: red; font-size: 16px;'
}, 'Red text');

// Style as object (preferred)
const box2 = div({
  style: {
    color: 'blue',
    fontSize: '18px',
    padding: '10px',
    backgroundColor: '#f0f0f0'
  }
}, 'Styled box');`))),

      h3('Event Handlers'),
      p('Attach event handlers using on* props:'),
      pre(code(...codeBlock(`import { button, input, div } from 'elit';

// Click handler
const btn = button({
  onclick: (e: Event) => {
    console.log('Button clicked', e);
  }
}, 'Click Me');

// Input handlers
const searchInput = input({
  type: 'text',
  oninput: (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    console.log('Input changed:', value);
  },
  onfocus: () => console.log('Input focused'),
  onblur: () => console.log('Input blurred')
});

// Mouse events
const interactive = div({
  onmouseenter: () => console.log('Mouse enter'),
  onmouseleave: () => console.log('Mouse leave'),
  onclick: () => console.log('Clicked')
}, 'Hover me');`))),

      h2('Working with Children'),
      h3('Multiple Children'),
      p('Pass multiple children as arguments:'),
      pre(code(...codeBlock(`import { div, h1, p, ul, li } from 'elit';

// Multiple direct children
const section = div(
  h1('Section Title'),
  p('First paragraph'),
  p('Second paragraph'),
  ul(
    li('Item 1'),
    li('Item 2'),
    li('Item 3')
  )
);`))),

      h3('Array of Children'),
      p('Use arrays for dynamic children:'),
      pre(code(...codeBlock(`import { ul, li, div, p } from 'elit';

// Array of elements
const items = ['Apple', 'Banana', 'Orange'];
const list = ul(
  items.map(item => li(item))
);

// Array spread
const paragraphs = [
  p('First paragraph'),
  p('Second paragraph'),
  p('Third paragraph')
];
const content = div(...paragraphs);

// Mixed children
const container = div(
  h1('Title'),
  ...items.map(item => p(item))
);`))),

      h3('Conditional Children'),
      p('Use null or false to conditionally include children:'),
      pre(code(...codeBlock(`import { div, p, span } from 'elit';

const isLoggedIn = true;
const hasError = false;

const page = div(
  p('Welcome'),
  isLoggedIn && p('You are logged in'),
  hasError && span({ className: 'error' }, 'An error occurred'),
  !isLoggedIn && p('Please log in')
);

// Ternary operator
const status = div(
  isLoggedIn
    ? span({ className: 'online' }, 'Online')
    : span({ className: 'offline' }, 'Offline')
);`))),

      h3('Nested Children'),
      p('Create deeply nested structures naturally:'),
      pre(code(...codeBlock(`import { div, header, nav, ul, li, a, main, section, h1, p, footer } from 'elit';

const page = div({ className: 'page' },
  header(
    nav(
      ul(
        li(a({ href: '/' }, 'Home')),
        li(a({ href: '/about' }, 'About')),
        li(a({ href: '/contact' }, 'Contact'))
      )
    )
  ),
  main(
    section(
      h1('Welcome'),
      p('This is the main content area.')
    )
  ),
  footer(
    p('© 2024 Company Name')
  )
);`))),

      h2('SVG Elements'),
      h3('Creating SVG Graphics'),
      p('Use SVG element factories prefixed with "svg":'),
      pre(code(...codeBlock(`import { svgSvg, svgCircle, svgRect, svgPath, svgG, svgText } from 'elit';

// Simple SVG with circle
const icon = svgSvg({
  width: '100',
  height: '100',
  viewBox: '0 0 100 100'
},
  svgCircle({
    cx: '50',
    cy: '50',
    r: '40',
    fill: '#3b82f6'
  })
);

// Complex SVG with multiple shapes
const logo = svgSvg({
  width: '200',
  height: '100',
  viewBox: '0 0 200 100'
},
  svgRect({
    x: '10',
    y: '10',
    width: '80',
    height: '80',
    fill: '#10b981',
    rx: '10'
  }),
  svgCircle({
    cx: '150',
    cy: '50',
    r: '30',
    fill: '#f59e0b'
  }),
  svgText({
    x: '100',
    y: '95',
    'text-anchor': 'middle',
    'font-size': '14',
    fill: '#1f2937'
  }, 'Logo')
);`))),

      h3('SVG Icons'),
      p('Create reusable icon components:'),
      pre(code(...codeBlock(`import { svgSvg, svgPath } from 'elit';

// Home icon
const HomeIcon = (size = 24, color = 'currentColor') =>
  svgSvg({
    width: String(size),
    height: String(size),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    'stroke-width': '2'
  },
    svgPath({
      d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'
    }),
    svgPath({
      d: 'M9 22V12h6v10'
    })
  );

// Use icon
const nav = div(
  HomeIcon(32, '#3b82f6'),
  'Home'
);`))),

      h2('MathML Elements'),
      h3('Mathematical Notation'),
      p('Use MathML element factories prefixed with "math":'),
      pre(code(...codeBlock(`import { mathMath, mathMrow, mathMi, mathMo, mathMn, mathMsup, mathMfrac } from 'elit';

// Simple equation: x + y = 10
const equation1 = mathMath(
  mathMrow(
    mathMi('x'),
    mathMo('+'),
    mathMi('y'),
    mathMo('='),
    mathMn('10')
  )
);

// Quadratic formula
const quadratic = mathMath(
  mathMrow(
    mathMi('x'),
    mathMo('='),
    mathMfrac(
      mathMrow(
        mathMo('-'),
        mathMi('b'),
        mathMo('±'),
        mathMsup(
          mathMi('b'),
          mathMn('2')
        )
      ),
      mathMrow(
        mathMn('2'),
        mathMi('a')
      )
    )
  )
);`))),

      h2('Advanced Patterns'),
      h3('Component Functions'),
      p('Create reusable component functions:'),
      pre(code(...codeBlock(`import { div, h2, p, button } from 'elit';

// Card component
const Card = (title: string, content: string, onAction?: () => void) =>
  div({ className: 'card' },
    h2({ className: 'card-title' }, title),
    p({ className: 'card-content' }, content),
    onAction && button({
      className: 'card-button',
      onclick: onAction
    }, 'Action')
  );

// Use component
const myCard = Card(
  'Welcome',
  'This is a reusable card component',
  () => console.log('Card action clicked')
);`))),

      h3('Props Spreading'),
      p('Dynamically build props objects:'),
      pre(code(...codeBlock(`import { button, div } from 'elit';

// Conditional props
const isDisabled = false;
const isPrimary = true;

const btn = button({
  className: \`btn \${isPrimary ? 'btn-primary' : 'btn-secondary'}\`,
  ...(isDisabled && { disabled: true }),
  onclick: () => console.log('Clicked')
}, 'Submit');

// Merge props
const defaultProps = {
  className: 'base-class',
  tabIndex: 0
};

const customProps = {
  className: 'custom-class',
  'aria-label': 'Custom button'
};

const merged = button({
  ...defaultProps,
  ...customProps
}, 'Button');`))),

      h3('Fragment Pattern'),
      p('Return arrays of elements for fragment-like behavior:'),
      pre(code(...codeBlock(`import { div, h1, p } from 'elit';

// Fragment function
const Fragment = (...children: any[]) => children;

// Use fragment
const content = div(
  ...Fragment(
    h1('Title 1'),
    p('Content 1'),
    h1('Title 2'),
    p('Content 2')
  )
);

// Conditional fragments
const showExtra = true;
const page = div(
  h1('Main Title'),
  ...showExtra ? [
    p('Extra paragraph 1'),
    p('Extra paragraph 2')
  ] : []
);`))),

      h3('Builder Pattern'),
      p('Create fluent APIs for complex elements:'),
      pre(code(...codeBlock(`import { div, button } from 'elit';

class ButtonBuilder {
  private props: any = { className: 'btn' };
  private text = '';

  primary() {
    this.props.className += ' btn-primary';
    return this;
  }

  large() {
    this.props.className += ' btn-lg';
    return this;
  }

  disabled() {
    this.props.disabled = true;
    return this;
  }

  onClick(handler: () => void) {
    this.props.onclick = handler;
    return this;
  }

  label(text: string) {
    this.text = text;
    return this;
  }

  build() {
    return button(this.props, this.text);
  }
}

// Use builder
const submitBtn = new ButtonBuilder()
  .primary()
  .large()
  .label('Submit Form')
  .onClick(() => console.log('Form submitted'))
  .build();`))),

      h2('Special Element: var'),
      h3('Using varElement'),
      p('The "var" HTML element requires a special name due to JavaScript keyword:'),
      pre(code(...codeBlock(`import { varElement, p, code } from 'elit';

// Use varElement for <var> tag
const formula = p(
  'The variable ',
  varElement('x'),
  ' represents the unknown value.'
);

// In mathematical expressions
const mathExpression = p(
  code(
    varElement('E'),
    ' = ',
    varElement('mc'),
    sup('2')
  )
);`))),

      h2('Dynamic Element Access'),
      h3('Using elements Object'),
      p('Access element factories dynamically:'),
      pre(code(...codeBlock(`import { elements } from 'elit';

// Dynamic element creation
const tagName = 'div';
const dynamicElement = elements[tagName as keyof typeof elements]?.();

// Create elements from string array
const tags = ['h1', 'p', 'div'];
const createdElements = tags.map(tag =>
  elements[tag as keyof typeof elements]?.('Content')
);

// Useful for templating systems
function createElement(tag: string, props: any, children: any[]) {
  const factory = elements[tag as keyof typeof elements];
  if (!factory) throw new Error(\`Unknown element: \${tag}\`);
  return factory(props, ...children);
}`))),

      h2('Best Practices'),
      ul(
        li('Use TypeScript for autocomplete and type safety'),
        li('Prefer object syntax for styles over string styles'),
        li('Create component functions for reusable elements'),
        li('Use semantic HTML elements (header, nav, main, footer)'),
        li('Add aria attributes for accessibility'),
        li('Keep element factories pure - no side effects'),
        li('Use conditional rendering with && and || operators'),
        li('Leverage array methods (map, filter) for dynamic children'),
        li('Group related elements in component functions'),
        li('Use constants for repeated prop values')
      ),

      h2('Complete Example: Todo List'),
      p('Here\'s a complete example using element factories:'),
      pre(code(...codeBlock(`import {
  div, h1, input, button, ul, li, span
} from 'elit';
import { createState } from 'elit';

// State
const todos = createState<string[]>([]);
const inputValue = createState('');

// Components
const TodoItem = (text: string, index: number) =>
  li({ className: 'todo-item' },
    span({ className: 'todo-text' }, text),
    button({
      className: 'btn-delete',
      onclick: () => {
        todos.value = todos.value.filter((_, i) => i !== index);
      }
    }, 'Delete')
  );

const TodoList = () =>
  ul({ className: 'todo-list' },
    ...todos.value.map((todo, index) => TodoItem(todo, index))
  );

const AddTodoForm = () =>
  div({ className: 'add-todo' },
    input({
      type: 'text',
      placeholder: 'Enter todo',
      value: inputValue.value,
      oninput: (e: Event) => {
        inputValue.value = (e.target as HTMLInputElement).value;
      }
    }),
    button({
      className: 'btn-add',
      onclick: () => {
        if (inputValue.value.trim()) {
          todos.value = [...todos.value, inputValue.value];
          inputValue.value = '';
        }
      }
    }, 'Add')
  );

// App
const App = () =>
  div({ className: 'app' },
    h1('Todo List'),
    AddTodoForm(),
    TodoList()
  );

// Render
document.body.appendChild(App().node);`))),

      h2('Conclusion'),
      p('Elit\'s element factories provide a simple, functional API for creating DOM elements. With full TypeScript support, flexible prop handling, and comprehensive element coverage, you can build any UI from simple components to complex applications. The functional approach keeps your code clean, composable, and easy to reason about.'),
      p('Key takeaways: Element factories are type-safe functions that create VNodes. Props are optional and flexible. Children can be passed as arguments or arrays. Use component functions for reusability. Leverage TypeScript for better developer experience.')
    ),
    th: div(
      p('เรียนรู้วิธีใช้ element factories ของ Elit เพื่อสร้าง DOM elements ด้วย API แบบ functional ที่เรียบง่าย คู่มือฉบับสมบูรณ์นี้ครอบคลุม HTML elements, SVG elements, MathML elements, props และ attributes, การจัดการ children และรูปแบบขั้นสูงสำหรับสร้าง component-based UIs'),

      h2('Element Factories คืออะไร?'),
      p('Element factories เป็นฟังก์ชันที่สร้าง VNode objects ที่เป็นตัวแทนของ DOM elements Elit มี element factories มากกว่า 100+ ตัว ครอบคลุม HTML, SVG และ MathML elements ทั้งหมด แต่ละ factory สร้างโครงสร้าง VNode ที่มีน้ำหนักเบาซึ่งสามารถ render เป็น DOM จริงได้'),
      ul(
        li('Type-safe: รองรับ TypeScript เต็มรูปแบบพร้อม autocomplete'),
        li('API ที่ยืดหยุ่น: Props ไม่บังคับ, children ไม่บังคับ, ใช้ร่วมกันได้'),
        li('Zero overhead: เรียก factory โดยตรง ไม่ต้อง compile JSX'),
        li('ครอบคลุมสมบูรณ์: HTML, SVG, MathML elements'),
        li('ใช้งานง่าย: เรียกฟังก์ชันแบบง่ายๆ ที่รู้สึกเป็นธรรมชาติ')
      ),

      h2('การสร้าง Element พื้นฐาน'),
      h3('Elements แบบง่าย'),
      p('สร้าง elements โดยเรียกฟังก์ชัน factory:'),
      pre(code(...codeBlock(`import { div, p, span, h1 } from 'elit';

// Element แบบง่ายพร้อมข้อความ
const heading = h1('สวัสดีชาวโลก');

// Element พร้อม children หลายตัว
const paragraph = p(
  'นี่คือ ',
  span('สำคัญ'),
  ' ข้อความ.'
);

// Elements ที่ซ้อนกัน
const container = div(
  h1('หัวเรื่อง'),
  p('เนื้อหาที่นี่')
);

// Render ไปยัง DOM
document.body.appendChild(container.node);`))),

      h3('Elements พร้อม Props'),
      p('ส่ง props เป็น argument แรกถ้าเป็น object:'),
      pre(code(...codeBlock(`import { div, button, input, a } from 'elit';

// Element พร้อม className
const card = div({ className: 'card' },
  'เนื้อหาการ์ด'
);

// Element พร้อม props หลายตัว
const link = a({
  href: 'https://example.com',
  target: '_blank',
  className: 'external-link'
}, 'เยี่ยมชม Example');

// Input พร้อม props
const textInput = input({
  type: 'text',
  placeholder: 'กรอกชื่อ',
  value: '',
  className: 'form-input'
});

// Button พร้อม event handler
const btn = button({
  className: 'btn btn-primary',
  onclick: () => console.log('คลิกแล้ว!')
}, 'คลิกฉัน');`))),

      h3('Elements ว่าง'),
      p('เรียก factories โดยไม่มี arguments เพื่อสร้าง elements ว่าง:'),
      pre(code(...codeBlock(`import { div, span, ul } from 'elit';

// Elements ว่าง
const emptyDiv = div();
const emptySpan = span();
const emptyList = ul();

// เพิ่ม children แบบไดนามิกภายหลัง
const container = div();
// ... จัดการ container.node โดยตรงถ้าจำเป็น`))),

      h2('การทำงานกับ Props'),
      h3('Props ทั่วไป'),
      p('HTML attributes มาตรฐานทำงานตามที่คาดหวัง:'),
      pre(code(...codeBlock(`import { div, input, img, a } from 'elit';

// Class names
const box = div({ className: 'box large primary' });

// ID
const main = div({ id: 'main-content' });

// Data attributes
const widget = div({
  'data-id': '123',
  'data-type': 'widget'
});

// Aria attributes
const menu = div({
  role: 'menu',
  'aria-label': 'เมนูหลัก'
});

// รูปภาพ
const logo = img({
  src: '/logo.png',
  alt: 'โลโก้บริษัท',
  width: '200',
  height: '100'
});

// ลิงก์
const navLink = a({
  href: '/about',
  title: 'เกี่ยวกับเรา'
}, 'เกี่ยวกับ');`))),

      h3('Inline Styles'),
      p('ใช้ style prop ด้วย string หรือ object:'),
      pre(code(...codeBlock(`import { div, p } from 'elit';

// Style เป็น string
const box1 = div({
  style: 'color: red; font-size: 16px;'
}, 'ข้อความสีแดง');

// Style เป็น object (แนะนำ)
const box2 = div({
  style: {
    color: 'blue',
    fontSize: '18px',
    padding: '10px',
    backgroundColor: '#f0f0f0'
  }
}, 'กล่องที่มีสไตล์');`))),

      h3('Event Handlers'),
      p('แนบ event handlers โดยใช้ on* props:'),
      pre(code(...codeBlock(`import { button, input, div } from 'elit';

// Click handler
const btn = button({
  onclick: (e: Event) => {
    console.log('ปุ่มถูกคลิก', e);
  }
}, 'คลิกฉัน');

// Input handlers
const searchInput = input({
  type: 'text',
  oninput: (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    console.log('Input เปลี่ยน:', value);
  },
  onfocus: () => console.log('Input ถูก focus'),
  onblur: () => console.log('Input ถูก blur')
});

// Mouse events
const interactive = div({
  onmouseenter: () => console.log('เมาส์เข้า'),
  onmouseleave: () => console.log('เมาส์ออก'),
  onclick: () => console.log('คลิกแล้ว')
}, 'วางเมาส์เหนือฉัน');`))),

      h2('การทำงานกับ Children'),
      h3('Children หลายตัว'),
      p('ส่ง children หลายตัวเป็น arguments:'),
      pre(code(...codeBlock(`import { div, h1, p, ul, li } from 'elit';

// Children หลายตัวโดยตรง
const section = div(
  h1('หัวเรื่องส่วน'),
  p('ย่อหน้าแรก'),
  p('ย่อหน้าที่สอง'),
  ul(
    li('รายการ 1'),
    li('รายการ 2'),
    li('รายการ 3')
  )
);`))),

      h3('Array ของ Children'),
      p('ใช้ arrays สำหรับ children แบบไดนามิก:'),
      pre(code(...codeBlock(`import { ul, li, div, p } from 'elit';

// Array ของ elements
const items = ['แอปเปิ้ล', 'กล้วย', 'ส้ม'];
const list = ul(
  items.map(item => li(item))
);

// Array spread
const paragraphs = [
  p('ย่อหน้าแรก'),
  p('ย่อหน้าที่สอง'),
  p('ย่อหน้าที่สาม')
];
const content = div(...paragraphs);

// Children แบบผสม
const container = div(
  h1('หัวเรื่อง'),
  ...items.map(item => p(item))
);`))),

      h3('Conditional Children'),
      p('ใช้ null หรือ false เพื่อรวม children แบบมีเงื่อนไข:'),
      pre(code(...codeBlock(`import { div, p, span } from 'elit';

const isLoggedIn = true;
const hasError = false;

const page = div(
  p('ยินดีต้อนรับ'),
  isLoggedIn && p('คุณเข้าสู่ระบบแล้ว'),
  hasError && span({ className: 'error' }, 'เกิดข้อผิดพลาด'),
  !isLoggedIn && p('กรุณาเข้าสู่ระบบ')
);

// Ternary operator
const status = div(
  isLoggedIn
    ? span({ className: 'online' }, 'ออนไลน์')
    : span({ className: 'offline' }, 'ออฟไลน์')
);`))),

      h3('Nested Children'),
      p('สร้างโครงสร้างที่ซ้อนกันลึกได้อย่างเป็นธรรมชาติ:'),
      pre(code(...codeBlock(`import { div, header, nav, ul, li, a, main, section, h1, p, footer } from 'elit';

const page = div({ className: 'page' },
  header(
    nav(
      ul(
        li(a({ href: '/' }, 'หน้าแรก')),
        li(a({ href: '/about' }, 'เกี่ยวกับ')),
        li(a({ href: '/contact' }, 'ติดต่อ'))
      )
    )
  ),
  main(
    section(
      h1('ยินดีต้อนรับ'),
      p('นี่คือพื้นที่เนื้อหาหลัก')
    )
  ),
  footer(
    p('© 2024 ชื่อบริษัท')
  )
);`))),

      h2('SVG Elements'),
      h3('การสร้าง SVG Graphics'),
      p('ใช้ SVG element factories ที่มี prefix "svg":'),
      pre(code(...codeBlock(`import { svgSvg, svgCircle, svgRect, svgPath, svgG, svgText } from 'elit';

// SVG แบบง่ายพร้อมวงกลม
const icon = svgSvg({
  width: '100',
  height: '100',
  viewBox: '0 0 100 100'
},
  svgCircle({
    cx: '50',
    cy: '50',
    r: '40',
    fill: '#3b82f6'
  })
);

// SVG ซับซ้อนพร้อมรูปร่างหลายแบบ
const logo = svgSvg({
  width: '200',
  height: '100',
  viewBox: '0 0 200 100'
},
  svgRect({
    x: '10',
    y: '10',
    width: '80',
    height: '80',
    fill: '#10b981',
    rx: '10'
  }),
  svgCircle({
    cx: '150',
    cy: '50',
    r: '30',
    fill: '#f59e0b'
  }),
  svgText({
    x: '100',
    y: '95',
    'text-anchor': 'middle',
    'font-size': '14',
    fill: '#1f2937'
  }, 'โลโก้')
);`))),

      h3('SVG Icons'),
      p('สร้าง icon components ที่ใช้ซ้ำได้:'),
      pre(code(...codeBlock(`import { svgSvg, svgPath } from 'elit';

// ไอคอนบ้าน
const HomeIcon = (size = 24, color = 'currentColor') =>
  svgSvg({
    width: String(size),
    height: String(size),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    'stroke-width': '2'
  },
    svgPath({
      d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'
    }),
    svgPath({
      d: 'M9 22V12h6v10'
    })
  );

// ใช้ icon
const nav = div(
  HomeIcon(32, '#3b82f6'),
  'หน้าแรก'
);`))),

      h2('MathML Elements'),
      h3('สัญลักษณ์ทางคณิตศาสตร์'),
      p('ใช้ MathML element factories ที่มี prefix "math":'),
      pre(code(...codeBlock(`import { mathMath, mathMrow, mathMi, mathMo, mathMn, mathMsup, mathMfrac } from 'elit';

// สมการง่าย: x + y = 10
const equation1 = mathMath(
  mathMrow(
    mathMi('x'),
    mathMo('+'),
    mathMi('y'),
    mathMo('='),
    mathMn('10')
  )
);

// สูตรกำลังสอง
const quadratic = mathMath(
  mathMrow(
    mathMi('x'),
    mathMo('='),
    mathMfrac(
      mathMrow(
        mathMo('-'),
        mathMi('b'),
        mathMo('±'),
        mathMsup(
          mathMi('b'),
          mathMn('2')
        )
      ),
      mathMrow(
        mathMn('2'),
        mathMi('a')
      )
    )
  )
);`))),

      h2('รูปแบบขั้นสูง'),
      h3('Component Functions'),
      p('สร้างฟังก์ชัน component ที่ใช้ซ้ำได้:'),
      pre(code(...codeBlock(`import { div, h2, p, button } from 'elit';

// Card component
const Card = (title: string, content: string, onAction?: () => void) =>
  div({ className: 'card' },
    h2({ className: 'card-title' }, title),
    p({ className: 'card-content' }, content),
    onAction && button({
      className: 'card-button',
      onclick: onAction
    }, 'ดำเนินการ')
  );

// ใช้ component
const myCard = Card(
  'ยินดีต้อนรับ',
  'นี่คือ card component ที่ใช้ซ้ำได้',
  () => console.log('Card action ถูกคลิก')
);`))),

      h3('Props Spreading'),
      p('สร้าง props objects แบบไดนามิก:'),
      pre(code(...codeBlock(`import { button, div } from 'elit';

// Conditional props
const isDisabled = false;
const isPrimary = true;

const btn = button({
  className: \`btn \${isPrimary ? 'btn-primary' : 'btn-secondary'}\`,
  ...(isDisabled && { disabled: true }),
  onclick: () => console.log('คลิกแล้ว')
}, 'ส่ง');

// Merge props
const defaultProps = {
  className: 'base-class',
  tabIndex: 0
};

const customProps = {
  className: 'custom-class',
  'aria-label': 'ปุ่มกำหนดเอง'
};

const merged = button({
  ...defaultProps,
  ...customProps
}, 'ปุ่ม');`))),

      h3('Fragment Pattern'),
      p('Return arrays ของ elements สำหรับพฤติกรรมแบบ fragment:'),
      pre(code(...codeBlock(`import { div, h1, p } from 'elit';

// Fragment function
const Fragment = (...children: any[]) => children;

// ใช้ fragment
const content = div(
  ...Fragment(
    h1('หัวเรื่อง 1'),
    p('เนื้อหา 1'),
    h1('หัวเรื่อง 2'),
    p('เนื้อหา 2')
  )
);

// Conditional fragments
const showExtra = true;
const page = div(
  h1('หัวเรื่องหลัก'),
  ...showExtra ? [
    p('ย่อหน้าเสริม 1'),
    p('ย่อหน้าเสริม 2')
  ] : []
);`))),

      h2('Element พิเศษ: var'),
      h3('การใช้ varElement'),
      p('HTML element "var" ต้องใช้ชื่อพิเศษเนื่องจาก JavaScript keyword:'),
      pre(code(...codeBlock(`import { varElement, p, code } from 'elit';

// ใช้ varElement สำหรับ tag <var>
const formula = p(
  'ตัวแปร ',
  varElement('x'),
  ' แทนค่าที่ไม่ทราบ'
);

// ในนิพจน์ทางคณิตศาสตร์
const mathExpression = p(
  code(
    varElement('E'),
    ' = ',
    varElement('mc'),
    sup('2')
  )
);`))),

      h2('การเข้าถึง Element แบบไดนามิก'),
      h3('การใช้ elements Object'),
      p('เข้าถึง element factories แบบไดนามิก:'),
      pre(code(...codeBlock(`import { elements } from 'elit';

// การสร้าง element แบบไดนามิก
const tagName = 'div';
const dynamicElement = elements[tagName as keyof typeof elements]?.();

// สร้าง elements จาก string array
const tags = ['h1', 'p', 'div'];
const createdElements = tags.map(tag =>
  elements[tag as keyof typeof elements]?.('เนื้อหา')
);

// มีประโยชน์สำหรับระบบ templating
function createElement(tag: string, props: any, children: any[]) {
  const factory = elements[tag as keyof typeof elements];
  if (!factory) throw new Error(\`Unknown element: \${tag}\`);
  return factory(props, ...children);
}`))),

      h2('แนวทางปฏิบัติที่ดี'),
      ul(
        li('ใช้ TypeScript สำหรับ autocomplete และ type safety'),
        li('ควรใช้ object syntax สำหรับ styles มากกว่า string styles'),
        li('สร้าง component functions สำหรับ elements ที่ใช้ซ้ำได้'),
        li('ใช้ semantic HTML elements (header, nav, main, footer)'),
        li('เพิ่ม aria attributes เพื่อการเข้าถึง'),
        li('รักษา element factories ให้ pure - ไม่มี side effects'),
        li('ใช้ conditional rendering ด้วย && และ || operators'),
        li('ใช้ประโยชน์จาก array methods (map, filter) สำหรับ dynamic children'),
        li('จัดกลุ่ม elements ที่เกี่ยวข้องใน component functions'),
        li('ใช้ constants สำหรับค่า prop ที่ซ้ำกัน')
      ),

      h2('ตัวอย่างที่สมบูรณ์: Todo List'),
      p('นี่คือตัวอย่างที่สมบูรณ์ที่ใช้ element factories:'),
      pre(code(...codeBlock(`import {
  div, h1, input, button, ul, li, span
} from 'elit';
import { createState } from 'elit';

// State
const todos = createState<string[]>([]);
const inputValue = createState('');

// Components
const TodoItem = (text: string, index: number) =>
  li({ className: 'todo-item' },
    span({ className: 'todo-text' }, text),
    button({
      className: 'btn-delete',
      onclick: () => {
        todos.value = todos.value.filter((_, i) => i !== index);
      }
    }, 'ลบ')
  );

const TodoList = () =>
  ul({ className: 'todo-list' },
    ...todos.value.map((todo, index) => TodoItem(todo, index))
  );

const AddTodoForm = () =>
  div({ className: 'add-todo' },
    input({
      type: 'text',
      placeholder: 'กรอกสิ่งที่ต้องทำ',
      value: inputValue.value,
      oninput: (e: Event) => {
        inputValue.value = (e.target as HTMLInputElement).value;
      }
    }),
    button({
      className: 'btn-add',
      onclick: () => {
        if (inputValue.value.trim()) {
          todos.value = [...todos.value, inputValue.value];
          inputValue.value = '';
        }
      }
    }, 'เพิ่ม')
  );

// App
const App = () =>
  div({ className: 'app' },
    h1('รายการสิ่งที่ต้องทำ'),
    AddTodoForm(),
    TodoList()
  );

// Render
document.body.appendChild(App().node);`))),

      h2('สรุป'),
      p('Element factories ของ Elit ให้ API แบบ functional ที่เรียบง่ายสำหรับสร้าง DOM elements ด้วยการรองรับ TypeScript เต็มรูปแบบ การจัดการ prop ที่ยืดหยุ่น และการครอบคลุม elements อย่างครบถ้วน คุณสามารถสร้าง UI ใดๆ ได้ตั้งแต่ components แบบง่ายไปจนถึงแอปพลิเคชันที่ซับซ้อน แนวทางแบบ functional ทำให้โค้ดของคุณสะอาด สามารถนำกลับมาใช้ได้ และง่ายต่อการเข้าใจ'),
      p('สรุปสำคัญ: Element factories เป็นฟังก์ชันที่ type-safe ซึ่งสร้าง VNodes Props ไม่บังคับและยืดหยุ่น Children สามารถส่งเป็น arguments หรือ arrays ใช้ component functions เพื่อการนำกลับมาใช้ ใช้ประโยชน์จาก TypeScript เพื่อประสบการณ์นักพัฒนาที่ดีขึ้น')
    )
  }
};
