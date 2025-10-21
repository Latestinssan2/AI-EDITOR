import { Project } from '../types';
import { v4 as uuidv4 } from 'uuid';

const PROJECTS_KEY = 'genesis_v8_projects';

class ProjectService {
    getProjects(): Project[] {
        const projectsJson = localStorage.getItem(PROJECTS_KEY);
        if (!projectsJson) {
            return [];
        }
        try {
            const projects = JSON.parse(projectsJson) as Project[];
            // Ensure dates are parsed correctly and sort by most recent
            return projects.map(p => ({...p, createdAt: new Date(p.createdAt).toISOString() })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (e) {
            console.error("Failed to parse projects:", e);
            return [];
        }
    }

    saveProject(projectData: Omit<Project, 'id' | 'createdAt'> & { id?: string }): Project {
        const projects = this.getProjects();
        const existingIndex = projectData.id ? projects.findIndex(p => p.id === projectData.id) : -1;

        if (existingIndex !== -1) {
            // Update existing project
            const updatedProject = { ...projects[existingIndex], ...projectData, name: projectData.name, state: projectData.state, preview: projectData.preview };
            projects[existingIndex] = updatedProject;
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
            return updatedProject;
        } else {
            // Create new project
            const newProject: Project = {
                ...projectData,
                id: `proj_${Date.now()}_${uuidv4()}`,
                createdAt: new Date().toISOString(),
            };
            projects.unshift(newProject); // Add to the beginning
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
            return newProject;
        }
    }

    deleteProject(id: string): void {
        let projects = this.getProjects();
        projects = projects.filter(p => p.id !== id);
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }

    getProject(id: string): Project | undefined {
        return this.getProjects().find(p => p.id === id);
    }
}

export const projectService = new ProjectService();
