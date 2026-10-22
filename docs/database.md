# CampusSathi AI - Database Schemas & Production Migration 🗄️

## 1. Relational Entities (SQLite / PostgreSQL)

### Users & Authentication
- `users`: `id (UUID)`, `email`, `password_hash`, `name`, `role ('student' | 'teacher' | 'admin')`, `college`, `course`, `year`, `semester`, `created_at`
- `profiles`: `user_id`, `avatar`, `accent_color`, `theme`, `default_language`, `daily_goal_minutes`, `xp`, `level`, `streak_days`, `longest_streak`, `campus_coins`

### Notes Marketplace (Creator Economy)
- `notes_library`:
  - `id`: Primary Key
  - `user_id`: Author ID
  - `title`: Title of the note (e.g., "Complete Operating Systems Unit 1-5")
  - `description`: Overview and key topics covered
  - `subject`: e.g. "Operating Systems", "Engineering Mathematics"
  - `branch`: e.g. "CSE", "IT", "Mechanical", "ECE"
  - `semester`: e.g. "Sem 4"
  - `university`: e.g. "AKTU", "RGPV", "VTU", "Delhi University"
  - `author_name`: Name of creator
  - `file_path`: Storage path or Cloudinary URL
  - `page_count`: Number of pages
  - `stars`: Average star rating (1.0 to 5.0 ⭐)
  - `rating_count`: Total ratings received
  - `price`: ₹0 (free) or ₹19-₹49 (monetized)
  - `is_verified`: 1 if certified by college professor, 0 otherwise
  - `downloads`: Download counter
- `note_ratings`: `id`, `note_id`, `user_id`, `rating (1-5)`, `comment`, `created_at`

### Campus Print Delivery Engine
- `print_orders`:
  - `id`: Order ID (e.g., `ORD_PRINT_1092`)
  - `user_id`: Customer ID
  - `document_title`: Title of file being printed
  - `file_path`: File URL
  - `pages`: Total page count
  - `copies`: Number of copies requested
  - `color_mode`: `'bw'` (Black & White) or `'color'`
  - `print_sides`: `'single'` or `'double'` (Duplex)
  - `binding_type`: `'staple'`, `'spiral'`, or `'hardbound'`
  - `hostel_delivery_address`: e.g., "BH-3 Room 214, North Block"
  - `phone_number`: 10-digit mobile number for WhatsApp delivery alerts
  - `urgency`: `'regular'` or `'express_morning_9am'`
  - `total_amount`: Total price in INR (₹)
  - `payment_status`: `'pending'` or `'paid'`
  - `order_status`: `'order_placed'` | `'printing'` | `'out_for_delivery'` | `'delivered'`
  - `created_at`: Timestamp

### Teacher & Classroom Operations
- `teacher_classes`: `id`, `teacher_id`, `name`, `subject`, `branch`, `semester`, `code`, `student_count`, `created_at`
- `teacher_assignments`: `id`, `class_id`, `teacher_id`, `title`, `topic`, `due_date`, `questions (JSON)`, `submissions_count`, `created_at`

### English & Placement Practice
- `english_conversations`: `id`, `user_id`, `mode`, `messages (JSON)`, `fluency_score`, `vocabulary_tips (JSON)`, `created_at`

---

## 2. Production Database Transition Guide

### MongoDB Atlas Migration:
1. Provide `MONGODB_URI` in `.env` (already supported by Mongoose/native driver).
2. Use the Mongoose models defined in `backend/src/services/database.ts`.

### Firebase Firestore Migration:
1. Run `set_up_firebase` tool or initialize `firebase-admin` with service account credentials.
2. Collections structure:
   - `/users/{userId}`
   - `/notes/{noteId}`
   - `/print_orders/{orderId}`
   - `/classes/{classId}/assignments/{assignmentId}`
