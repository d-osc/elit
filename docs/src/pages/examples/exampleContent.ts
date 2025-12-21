import { VNode } from 'elit';
import { SnakeGameContent } from './snake-game';
import { TodoListContent } from './todo-list';
import { StockManagementContent } from './stock-management';
import { SearchContent } from './search';
import { POSSystemContent } from './pos-system';
import { ProjectManagementContent } from './project-management';
import { LeaveManagementContent } from './leave-management';
import { RPGGameContent } from './rpg-game';
import { ChatAppContent } from './chat-app';
import { AIChatContent } from './ai-chat';
import { ThreeDSceneContent } from './3d-scene';
import { MonacoEditorContent } from './monaco-editor';

export interface ExampleItem {
  id: string;
  title: {
    en: string;
    th: string;
  };
  description: {
    en: string;
    th: string;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  content: VNode;
}

export const examplesList: ExampleItem[] = [
  {
    id: 'snake-game',
    title: {
      en: 'Snake Game',
      th: 'เกมงู'
    },
    description: {
      en: 'A classic Snake game showcasing reactive state management, game loops, keyboard handling, and collision detection.',
      th: 'เกมงูคลาสสิกที่แสดงการจัดการ state แบบ reactive, game loops, การจัดการคีย์บอร์ด และการตรวจสอบการชน'
    },
    difficulty: 'intermediate',
    tags: ['Game', 'Reactive', 'State Management', 'Events'],
    content: SnakeGameContent
  },
  {
    id: 'todo-list',
    title: {
      en: 'TODO List',
      th: 'รายการสิ่งที่ต้องทำ'
    },
    description: {
      en: 'A full-featured TODO list application demonstrating array manipulation, filtering, CRUD operations, and reactive state updates.',
      th: 'แอปพลิเคชันรายการสิ่งที่ต้องทำที่มีฟีเจอร์ครบครัน แสดงการจัดการอาร์เรย์ การกรอง การดำเนินการ CRUD และการอัปเดต state แบบ reactive'
    },
    difficulty: 'beginner',
    tags: ['CRUD', 'Array', 'Filtering', 'State Management'],
    content: TodoListContent
  },
  {
    id: 'search',
    title: {
      en: 'Search System',
      th: 'ระบบค้นหา'
    },
    description: {
      en: 'An advanced search system with multi-mode filtering, real-time text highlighting, category filters, and instant results.',
      th: 'ระบบค้นหาขั้นสูงที่มีการกรองหลายโหมด การไฮไลต์ข้อความแบบเรียลไทม์ ฟิลเตอร์หมวดหมู่ และผลลัพธ์แบบทันที'
    },
    difficulty: 'intermediate',
    tags: ['Search', 'Filtering', 'Highlighting', 'Real-time'],
    content: SearchContent
  },
  {
    id: 'stock-management',
    title: {
      en: 'Stock Management',
      th: 'ระบบจัดการสต็อก'
    },
    description: {
      en: 'A complete inventory management system with multi-level filtering, real-time statistics, stock alerts, and dynamic sorting.',
      th: 'ระบบจัดการคลังสินค้าที่สมบูรณ์พร้อมการกรองหลายระดับ สถิติแบบเรียลไทม์ การแจ้งเตือนสต็อก และการเรียงลำดับแบบไดนามิก'
    },
    difficulty: 'intermediate',
    tags: ['Inventory', 'Statistics', 'Filtering', 'Business Logic'],
    content: StockManagementContent
  },
  {
    id: 'pos-system',
    title: {
      en: 'POS System',
      th: 'ระบบขายหน้าร้าน'
    },
    description: {
      en: 'A complete Point of Sale system with shopping cart, real-time calculations, product search, and payment processing.',
      th: 'ระบบขายหน้าร้านที่สมบูรณ์พร้อมตะกร้าสินค้า การคำนวณแบบเรียลไทม์ การค้นหาสินค้า และการประมวลผลการชำระเงิน'
    },
    difficulty: 'intermediate',
    tags: ['E-commerce', 'Cart', 'Payment', 'Real-time Calculations'],
    content: POSSystemContent
  },
  {
    id: 'project-management',
    title: {
      en: 'Project Management',
      th: 'ระบบจัดการโปรเจกต์'
    },
    description: {
      en: 'A project management system with task tracking, multi-criteria filtering, status updates, team assignment, and real-time statistics.',
      th: 'ระบบจัดการโปรเจกต์พร้อมการติดตามงาน การกรองหลายเกณฑ์ การอัปเดตสถานะ การมอบหมายทีม และสถิติแบบเรียลไทม์'
    },
    difficulty: 'intermediate',
    tags: ['Task Management', 'Filtering', 'Team Collaboration', 'Statistics'],
    content: ProjectManagementContent
  },
  {
    id: 'leave-management',
    title: {
      en: 'Leave Management',
      th: 'ระบบจัดการการลา'
    },
    description: {
      en: 'An employee leave management system with request submission, approval workflows, multi-criteria filtering, and real-time analytics.',
      th: 'ระบบจัดการการลาพนักงานพร้อมการส่งคำขอ กระบวนการอนุมัติ การกรองหลายเกณฑ์ และการวิเคราะห์แบบเรียลไทม์'
    },
    difficulty: 'intermediate',
    tags: ['HR', 'Workflow', 'Approval', 'Date Calculations', 'Statistics'],
    content: LeaveManagementContent
  },
  {
    id: 'rpg-game',
    title: {
      en: 'RPG Game',
      th: 'เกม RPG'
    },
    description: {
      en: 'A role-playing game with turn-based combat, character progression, inventory system, quest tracking, and shop mechanics.',
      th: 'เกมสวมบทบาทที่มีระบบการต่อสู้แบบเทิร์น การพัฒนาตัวละคร ระบบของใช้ การติดตามเควส และระบบร้านค้า'
    },
    difficulty: 'advanced',
    tags: ['Game', 'Combat', 'Progression', 'Inventory', 'Quests', 'Complex State'],
    content: RPGGameContent
  },
  {
    id: 'chat-app',
    title: {
      en: 'Chat Application',
      th: 'แอปพลิเคชันแชท'
    },
    description: {
      en: 'A real-time chat application with multiple rooms, typing indicators, online user presence, emoji support, and message management.',
      th: 'แอปพลิเคชันแชทแบบเรียลไทม์พร้อมห้องแชทหลายห้อง ตัวบอกสถานะการพิมพ์ การแสดงผู้ใช้ออนไลน์ การรองรับอีโมจิ และการจัดการข้อความ'
    },
    difficulty: 'intermediate',
    tags: ['Chat', 'Real-time', 'Messaging', 'Rooms', 'Typing Indicator', 'User Presence'],
    content: ChatAppContent
  },
  {
    id: 'ai-chat',
    title: {
      en: 'AI Chat Assistant',
      th: 'ผู้ช่วย AI Chat'
    },
    description: {
      en: 'An AI chat application with streaming responses, multiple conversations, message history, settings management, and copy functionality.',
      th: 'แอปพลิเคชันแชท AI พร้อมการตอบสนองแบบสตรีมมิ่ง การสนทนาหลายเธรด ประวัติข้อความ การจัดการการตั้งค่า และฟังก์ชันคัดลอก'
    },
    difficulty: 'advanced',
    tags: ['AI', 'Chat', 'Streaming', 'Conversations', 'Clipboard', 'Settings'],
    content: AIChatContent
  },
  {
    id: '3d-scene',
    title: {
      en: '3D Scene',
      th: 'ฉาก 3D'
    },
    description: {
      en: 'An interactive 3D scene with multiple shapes, camera controls, real-time transformations, lighting system, wireframe mode, and animation.',
      th: 'ฉาก 3D แบบอินเทอร์แอคทีฟพร้อมรูปทรงหลายแบบ การควบคุมกล้อง การแปลงแบบเรียลไทม์ ระบบแสง โหมด Wireframe และแอนิเมชัน'
    },
    difficulty: 'advanced',
    tags: ['3D', 'Canvas', 'Animation', 'Graphics', 'Geometry', 'Lighting', 'Camera'],
    content: ThreeDSceneContent
  },
  {
    id: 'monaco-editor',
    title: {
      en: 'Monaco Editor Integration',
      th: 'การผสานรวม Monaco Editor'
    },
    description: {
      en: 'Integration of Monaco Editor (VS Code\'s editor) with Elit, featuring syntax highlighting, IntelliSense, multiple themes, and keyboard shortcuts.',
      th: 'การผสานรวม Monaco Editor (โปรแกรมแก้ไขของ VS Code) กับ Elit พร้อมไฮไลต์ไวยากรณ์ IntelliSense หลายธีม และแป้นพิมพ์ลัด'
    },
    difficulty: 'intermediate',
    tags: ['Editor', 'Code Editor', 'Monaco', 'VS Code', 'IntelliSense', 'Syntax Highlighting'],
    content: MonacoEditorContent
  }
];
