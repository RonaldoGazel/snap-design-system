import { Routes } from '@angular/router';
import { TaskListComponent } from './pages/task-list/task-list.component';

export const tasksRoutes: Routes = [
  { path: '', component: TaskListComponent },
];
