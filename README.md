# HRMS System - Human Resource Management System

A comprehensive Next.js-based Human Resource Management System with role-based access control, salary management, attendance tracking, leave management, and messaging capabilities.

## Project Structure

```
hrms-system/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (employee)/        # Employee dashboard
│   ├── (admin)/           # Admin dashboard
│   ├── api/               # API routes
│   └── layout.tsx
├── components/            # Reusable React components
│   ├── ui/               # UI components
│   ├── layout/           # Layout components
│   ├── attendance/       # Attendance components
│   ├── leaves/           # Leave components
│   ├── salary/           # Salary components
│   ├── employees/        # Employee components
│   └── messages/         # Messaging components
├── services/             # Business logic services
├── lib/                  # Utilities and Firebase config
├── store/                # Global state (Zustand)
├── types/                # TypeScript type definitions
├── utils/                # Helper functions
├── styles/               # CSS files
├── middleware.ts         # Route protection
└── firebase.json         # Firebase config
```

## Features

### Authentication
- Employee registration and login
- Admin registration with verification key
- Role-based access control
- Secure token management

### Employee Dashboard
- **Attendance**: Check-in/check-out system
- **Leaves**: Apply for leaves, view balance
- **Salary**: View salary breakdown and history
- **Messages**: Communicate with admin and colleagues
- **Profile**: Update personal information

### Admin Dashboard
- **Employee Management**: Add, edit, delete employees
- **Attendance**: Monitor attendance, manual marking
- **Leave Management**: Approve/reject leave requests
- **Salary Management**: Set salary, calculate deductions
- **Reports**: Generate attendance, salary, and leave reports
- **Settings**: Configure leave policies and company settings

### Key Modules

#### Salary System
- Base salary + allowances - deductions = net salary
- Per-day salary calculation: `baseSalary / workingDays`
- Automatic leave deduction calculation
- Monthly salary generation

#### Leave Management
- Multiple leave types (Casual, Sick, Earned, Unpaid, etc.)
- Leave balance tracking
- Approval workflow
- Carry-forward policy support

#### Attendance
- Digital check-in/check-out
- Manual attendance marking (admin)
- Monthly attendance reports
- Attendance percentage calculation

## Tech Stack

- **Frontend**: Next.js 14+, React, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hrms-system
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a Firebase project
   - Update `.env.local` with your Firebase credentials:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Attendance
- `POST /api/attendance` - Record attendance
- `GET /api/attendance/[userId]/[month]` - Get monthly attendance

### Leaves
- `GET /api/leaves/[userId]` - Get user leaves
- `POST /api/leaves/apply` - Apply for leave
- `PUT /api/leaves/[id]/approve` - Approve leave

### Salary
- `GET /api/salary/[userId]/[month]` - Get salary
- `POST /api/salary/calculate` - Calculate salary

### Messages
- `GET /api/messages/[userId]` - Get user messages
- `POST /api/messages/send` - Send message

## Role Permissions

### Employee
- View own dashboard
- Check-in/check-out
- Apply for leaves
- View own salary
- Send messages
- Edit profile

### Admin
- View admin dashboard
- Manage all employees
- Mark attendance
- Approve/reject leaves
- Set salary configuration
- Generate reports
- Manage system settings
- Message any employee

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Open a pull request

## License

MIT License - See LICENSE file for details

## Support

For support, email support@hrms.com or create an issue in the repository.
