# Project-Based Todo List App

A modern, feature-rich todo list application built with Next.js and Supabase that supports project organization, task management, and productivity workflows.

## Features

- ✅ **Project Management**: Create, edit, and organize projects
- 📋 **Task Organization**: Tasks belong to projects with priority levels and tags
- 📅 **Special Categories**: 
  - "Today" - Tasks for immediate focus
  - "This Week Backlog" - Tasks planned for the current week
- 🏷️ **Tag System**: Flexible tagging system for task categorization
- ➡️ **Quick Actions**: Move tasks between projects and special categories
- 🖱️ **Drag & Drop**: Reorder projects (drag and drop for tasks coming soon)
- 💾 **Persistent Storage**: Currently localStorage (Supabase integration ready)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for database integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd my-todo-list
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm install @supabase/supabase-js
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
   - Copy your project URL and anon key

4. **Configure environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

The app uses the following Supabase tables:

- **projects**: Stores project information and ordering
- **tasks**: Stores task details, priority, completion status
- **tags**: Stores available tags
- **task_tags**: Junction table for task-tag relationships

Special projects with fixed IDs:
- `today`: For today's focused tasks
- `this-week`: For this week's backlog

## Usage

### Managing Projects

1. **Add Project**: Use the "Add Project" button in the Projects section
2. **Edit Project**: Click the edit icon on any project (except special ones)
3. **Reorder Projects**: Drag projects using the grip handle (non-special projects only)
4. **Delete Project**: Click the trash icon (tasks will move to "No Project")

### Managing Tasks

1. **Add Task**: 
   - Enter task description
   - Set priority (Low/Medium/High)
   - Assign to project (optional)
   - Add tags
   
2. **Edit Task**: Click the edit icon on any task

3. **Quick Actions**:
   - **Week**: Move task to "This Week Backlog"
   - **Today**: Move task to "Today" 
   - **✓**: Mark as complete/incomplete
   - **🗑️**: Delete task

### Managing Tags

1. **Add Tag**: Use the tag input in the Tags section
2. **Remove Tag**: Click the X on any tag (removes from all tasks)
3. **Apply Tags**: Select tags when creating/editing tasks

## Current Implementation Status

✅ **Completed Features**:
- Project management UI
- Task-project relationships  
- This Week Backlog section
- Today Todo section
- Task action buttons (move to week/today)
- Basic drag-and-drop for project ordering
- Tag management system
- Responsive design

🚧 **Ready for Integration** (when Supabase is configured):
- Supabase database schema (`supabase-schema.sql`)
- Supabase service functions (`src/lib/supabase.js`)
- Real-time updates
- User authentication (optional)

## File Structure

```
src/
├── app/
│   ├── layout.js          # App layout
│   ├── page.jsx           # Main page
│   └── globals.css        # Global styles
├── components/
│   ├── advanced-todo-list.jsx  # Main component
│   └── ui/                     # UI components
└── lib/
    ├── utils.js          # Utility functions
    └── supabase.js       # Supabase integration (ready)
```

## Next Steps

1. **Supabase Integration**: Replace localStorage with Supabase functions
2. **Enhanced Drag & Drop**: Add task reordering within projects  
3. **User Authentication**: Add user accounts and data isolation
4. **Real-time Collaboration**: Multiple users working on shared projects
5. **Mobile App**: React Native version
6. **Advanced Features**: Due dates, notifications, project templates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
