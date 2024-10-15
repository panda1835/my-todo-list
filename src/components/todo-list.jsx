"use client";
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
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
    <Button variant="ghost" size="icon" onClick={onEdit}>
      <Edit2 className="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="icon" onClick={onDelete}>
      <Trash2 className="h-4 w-4" />
    </Button>
  </li>
)

export function TodoListComponent() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState("")
  const [currentDate, setCurrentDate] = useState("")
  const [editingTask, setEditingTask] = useState(null)
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

  const addTask = () => {
    if (newTask.trim() !== "") {
      setTasks(
        [...tasks, { id: Date.now(), text: newTask, completed: false, priority: "MEDIUM", tags: [] }]
      )
      setNewTask("")
    }
  }

  const updateTask = (updatedTask) => {
    setTasks(tasks.map(task => task.id === updatedTask.id ? updatedTask : task))
    setEditingTask(null)
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
      acc["Others"] = [...(acc["Others"] || []), task]
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
      <h2 className="text-lg font-semibold mb-2">Tasks</h2>

      <div className="flex mb-4">
        <Input
          type="text"
          placeholder="Add a new task"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="flex-grow mr-2"
          onKeyPress={(e) => e.key === 'Enter' && addTask()} />
        <Button onClick={addTask}>Add</Button>
      </div>
      <Separator className="mb-4" />
      
      {editingTask && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Editing Task</h3>
          <Input
            value={editingTask.text}
            onChange={(e) => setEditingTask({ ...editingTask, text: e.target.value })}
            className="mb-2" />
          <Select
            value={editingTask.priority}
            onValueChange={(value) => setEditingTask({ ...editingTask, priority: value })}>
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
                  checked={editingTask.tags.includes(tag)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setEditingTask({ ...editingTask, tags: [...editingTask.tags, tag] })
                    } else {
                      setEditingTask({ ...editingTask, tags: editingTask.tags.filter(t => t !== tag) })
                    }
                  }} />
                <span>{tag}</span>
              </label>
            ))}
          </div>
          <Button onClick={() => updateTask(editingTask)}>Save</Button>
        </div>
      )}
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