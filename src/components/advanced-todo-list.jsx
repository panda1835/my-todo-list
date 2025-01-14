"use client";
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Edit2, Plus, X } from "lucide-react"

const priorityColors = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800"
}

const priorityOrder = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2
}

const TaskItem = ({
  task,
  onToggle,
  onEdit,
  onDelete
}) => (
  <li className="flex items-center bg-gray-50 p-2 rounded mb-2">
    <Checkbox checked={task.completed} onCheckedChange={onToggle} className="mr-2" />
    <span
      className={`flex-grow ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
      {task.text}
    </span>
    <span
      className={`text-xs font-semibold px-2 py-1 rounded-full mr-2 ${priorityColors[task.priority]}`}>
      {task.priority}
    </span>
    {task.tags.map(tag => (
      <span
        key={tag}
        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1">
        {tag}
      </span>
    ))}
    <Button variant="ghost" size="icon" onClick={onEdit}>
      <Edit2 className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon" onClick={onDelete}>
      <Trash2 className="h-4 w-4" />
    </Button>
  </li>
)

export function AdvancedTodoListComponent() {
  const [tasks, setTasks] = useState([])
  const [currentDate, setCurrentDate] = useState("")
  const [editingTask, setEditingTask] = useState(null)
  const [newTaskText, setNewTaskText] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM")
  const [newTaskTags, setNewTaskTags] = useState([])
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    const date = new Date()
    setCurrentDate(date.toLocaleDateString(
      'en-US',
      { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    ))
    
    // Load tasks and tags from local storage
    const storedTasks = localStorage.getItem('tasks')
    if (storedTasks) setTasks(JSON.parse(storedTasks))
    
    const storedTags = localStorage.getItem('tags')
    if (storedTags) setTags(JSON.parse(storedTags))
  }, [])

  useEffect(() => {
    // Save tasks and tags to local storage whenever they change
    localStorage.setItem('tasks', JSON.stringify(tasks))
    localStorage.setItem('tags', JSON.stringify(tags))
  }, [tasks, tags])

  const addNewTask = () => {
    if (newTaskText.trim() !== "") {
      const newTask = {
        id: Date.now(),
        text: newTaskText,
        completed: false,
        priority: newTaskPriority,
        tags: newTaskTags,
      }
      setTasks([...tasks, newTask])
      setNewTaskText("")
      setNewTaskPriority("MEDIUM")
      setNewTaskTags([])
    }
  }

  const updateTask = () => {
    if (editingTask && editingTask.text.trim() !== "") {
      setTasks(tasks.map(task => task.id === editingTask.id ? editingTask : task))
      setEditingTask(null)
    }
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task))
  }

  const removeTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const addTag = () => {
    if (newTag.trim() !== "" && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
    setTasks(tasks.map(task => ({
      ...task,
      tags: task.tags.filter(tag => tag !== tagToRemove)
    })))
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  const groupedTasks = sortedTasks.reduce((acc, task) => {
    if (task.tags.length === 0) {
      acc["others"] = [...(acc["others"] || []), task]
    } else {
      task.tags.forEach(tag => {
        acc[tag] = [...(acc[tag] || []), task]
      })
    }
    return acc
  }, {})

  return (
    (<div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Simple To-Do List</h1>
      <p className="text-sm text-gray-600 mb-6">{currentDate}</p>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Tags</h2>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm flex items-center">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 text-gray-600 hover:text-gray-800">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex">
          <Input
            type="text"
            placeholder="Add a new tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="flex-grow mr-2"
            onKeyPress={(e) => e.key === 'Enter' && addTag()} />
          <Button onClick={addTag} size="icon"><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">{editingTask ? 'Edit Task' : 'Add New Task'}</h3>
        <Input
          value={editingTask ? editingTask.text : newTaskText}
          onChange={(e) => editingTask 
            ? setEditingTask({...editingTask, text: e.target.value})
            : setNewTaskText(e.target.value)
          }
          placeholder="Task description"
          className="mb-2" />
        <Select
          value={editingTask ? editingTask.priority : newTaskPriority}
          onValueChange={(value) => editingTask
            ? setEditingTask({...editingTask, priority: value})
            : setNewTaskPriority(value)
          }>
          <SelectTrigger className="mb-2">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <label key={tag} className="flex items-center space-x-2">
              <Checkbox
                checked={editingTask 
                  ? editingTask.tags.includes(tag)
                  : newTaskTags.includes(tag)
                }
                onCheckedChange={(checked) => {
                  if (editingTask) {
                    setEditingTask(prev => ({
                      ...prev,
                      tags: checked 
                        ? [...prev.tags, tag]
                        : prev.tags.filter(t => t !== tag)
                    }))
                  } else {
                    setNewTaskTags(prev => 
                      checked ? [...prev, tag] : prev.filter(t => t !== tag))
                  }
                }} />
              <span>{tag}</span>
            </label>
          ))}
        </div>
        <Button onClick={editingTask ? updateTask : addNewTask}>
          {editingTask ? 'Update' : 'Add Task'}
        </Button>
        {editingTask && (
          <Button onClick={() => setEditingTask(null)} className="ml-2">
            Cancel
          </Button>
        )}
      </div>
      {Object.entries(groupedTasks).map(([tag, tasks]) => (
        <div key={tag} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{tag}</h2>
          <ul>
            {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task.id)}
                onEdit={() => setEditingTask(task)}
                onDelete={() => removeTask(task.id)} />
            ))}
          </ul>
        </div>
      ))}
    </div>)
  );
}