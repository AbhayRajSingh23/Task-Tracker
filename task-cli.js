#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Configuration
const TASKS_FILE = 'tasks.json';

// Task status constants
const STATUS = {
    TODO: 'todo',
    IN_PROGRESS: 'in-progress',
    DONE: 'done'
};

// Utility functions
function loadTasks() {
    try {
        if (fs.existsSync(TASKS_FILE)) {
            const data = fs.readFileSync(TASKS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading tasks file:', error.message);
    }
    return [];
}

function saveTasks(tasks) {
    try {
        fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving tasks file:', error.message);
        return false;
    }
}

function generateId(tasks) {
    if (tasks.length === 0) return 1;
    const maxId = Math.max(...tasks.map(task => task.id));
    return maxId + 1;
}

function getCurrentTimestamp() {
    return new Date().toISOString();
}

function findTaskById(tasks, id) {
    return tasks.find(task => task.id === parseInt(id));
}

function validateStatus(status) {
    return Object.values(STATUS).includes(status);
}

function formatTask(task) {
    const statusEmoji = {
        [STATUS.TODO]: '⏳',
        [STATUS.IN_PROGRESS]: '🔄',
        [STATUS.DONE]: '✅'
    };
    
    return `[${task.id}] ${statusEmoji[task.status]} ${task.description} (${task.status})`;
}

// Command functions
function addTask(description) {
    if (!description) {
        console.error('Error: Task description is required');
        console.log('Usage: task-cli add "Task description"');
        return false;
    }

    const tasks = loadTasks();
    const newTask = {
        id: generateId(tasks),
        description: description,
        status: STATUS.TODO,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
    };

    tasks.push(newTask);
    
    if (saveTasks(tasks)) {
        console.log(`Task added successfully (ID: ${newTask.id})`);
        return true;
    }
    return false;
}

function updateTask(id, description) {
    if (!id || !description) {
        console.error('Error: Task ID and description are required');
        console.log('Usage: task-cli update <id> "New description"');
        return false;
    }

    const tasks = loadTasks();
    const task = findTaskById(tasks, id);
    
    if (!task) {
        console.error(`Error: Task with ID ${id} not found`);
        return false;
    }

    task.description = description;
    task.updatedAt = getCurrentTimestamp();
    
    if (saveTasks(tasks)) {
        console.log(`Task ${id} updated successfully`);
        return true;
    }
    return false;
}

function deleteTask(id) {
    if (!id) {
        console.error('Error: Task ID is required');
        console.log('Usage: task-cli delete <id>');
        return false;
    }

    const tasks = loadTasks();
    const taskIndex = tasks.findIndex(task => task.id === parseInt(id));
    
    if (taskIndex === -1) {
        console.error(`Error: Task with ID ${id} not found`);
        return false;
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];
    
    if (saveTasks(tasks)) {
        console.log(`Task ${id} deleted successfully`);
        return true;
    }
    return false;
}

function markTask(id, status) {
    if (!id || !status) {
        console.error('Error: Task ID and status are required');
        console.log('Usage: task-cli mark-<status> <id>');
        return false;
    }

    if (!validateStatus(status)) {
        console.error(`Error: Invalid status. Valid statuses are: ${Object.values(STATUS).join(', ')}`);
        return false;
    }

    const tasks = loadTasks();
    const task = findTaskById(tasks, id);
    
    if (!task) {
        console.error(`Error: Task with ID ${id} not found`);
        return false;
    }

    task.status = status;
    task.updatedAt = getCurrentTimestamp();
    
    if (saveTasks(tasks)) {
        console.log(`Task ${id} marked as ${status}`);
        return true;
    }
    return false;
}

function listTasks(status = null) {
    const tasks = loadTasks();
    
    if (tasks.length === 0) {
        console.log('No tasks found.');
        return;
    }

    let filteredTasks = tasks;
    
    if (status) {
        if (!validateStatus(status)) {
            console.error(`Error: Invalid status. Valid statuses are: ${Object.values(STATUS).join(', ')}`);
            return;
        }
        filteredTasks = tasks.filter(task => task.status === status);
        
        if (filteredTasks.length === 0) {
            console.log(`No tasks found with status: ${status}`);
            return;
        }
    }

    console.log(`\n${status ? `${status.toUpperCase()} TASKS:` : 'ALL TASKS:'}`);
    console.log('='.repeat(50));
    
    filteredTasks.forEach(task => {
        console.log(formatTask(task));
    });
    
    console.log(`\nTotal: ${filteredTasks.length} task(s)`);
}

function showHelp() {
    console.log(`
Task Tracker CLI - A simple command line task manager

USAGE:
  task-cli <command> [arguments]

COMMANDS:
  add "description"           Add a new task
  update <id> "description"   Update an existing task
  delete <id>                Delete a task
  mark-in-progress <id>      Mark a task as in progress
  mark-done <id>             Mark a task as done
  list                       List all tasks
  list todo                  List tasks with todo status
  list in-progress           List tasks with in-progress status
  list done                  List tasks with done status
  help                       Show this help message

EXAMPLES:
  task-cli add "Buy groceries"
  task-cli update 1 "Buy groceries and cook dinner"
  task-cli mark-done 1
  task-cli list done
  task-cli delete 1
`);
}

// Main function
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        showHelp();
        return;
    }

    const command = args[0];
    
    try {
        switch (command) {
            case 'add':
                addTask(args[1]);
                break;
                
            case 'update':
                updateTask(args[1], args[2]);
                break;
                
            case 'delete':
                deleteTask(args[1]);
                break;
                
            case 'mark-in-progress':
                markTask(args[1], STATUS.IN_PROGRESS);
                break;
                
            case 'mark-done':
                markTask(args[1], STATUS.DONE);
                break;
                
            case 'list':
                listTasks(args[1]);
                break;
                
            case 'help':
                showHelp();
                break;
                
            default:
                console.error(`Error: Unknown command '${command}'`);
                console.log('Use "task-cli help" to see available commands');
                break;
        }
    } catch (error) {
        console.error('An unexpected error occurred:', error.message);
    }
}

// Run the application
main();

// Export functions for potential testing or external use
export {
    addTask,
    updateTask,
    deleteTask,
    markTask,
    listTasks,
    loadTasks,
    saveTasks
};
