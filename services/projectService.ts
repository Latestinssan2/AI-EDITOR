import { Project } from '../types';

const PROJECTS_KEY = 'genesis_v8_projects';

// Helper to remove non-serializable parts before saving
const sanitizeProjectForStorage = (project: Omit<Project, 'id' | 'createdAt'>): Omit<Project, 'id' | 'createdAt' | 'state'> & { state: any } => {
    const sanitizedState = { ...project.state };

    // Function to sanitize a single clip
    const sanitizeClip = (clip: any) => {
        if (clip.source && clip.source.file) {
            const { file, ...restOfSource } = clip.source;
            return { ...clip, source: restOfSource };
        }
        return clip;
    };
    
    // Sanitize state for video projects
    if (project.type === 'video' && 'timelineClips' in sanitizedState) {
        sanitizedState.timelineClips = sanitizedState.timelineClips.map(sanitizeClip);
        sanitizedState.audioClips = sanitizedState.audioClips.map(sanitizeClip);
    }
    
    // Sanitize state for slideshow projects
    if (project.type === 'slideshow' && 'slideshowItems' in sanitizedState) {
       sanitizedState.slideshowItems = sanitizedState.slideshowItems.map((item: any) => {
           if (item.file) {
               const { file, ...restOfItem } = item;
               return restOfItem;
           }
           return item;
       });
    }

    return { ...project, state: sanitizedState };
};


class ProjectService {

    getProjects(): Project[] {
        const projectsJson = localStorage.getItem(PROJECTS_KEY);
        if (!projectsJson) return [];
        try {
            const projects = JSON.parse(projectsJson) as Project[];
            return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (e) {
            console.error("Failed to parse projects from localStorage", e);
            return [];
        }
    }

    saveProject(projectData: Omit<Project, 'id' | 'createdAt'>): Project {
        const projects = this.getProjects();
        const newProject: Project = {
            ...projectData,
            id: `proj_${Date.now()}`,
            createdAt: new Date().toISOString(),
        };

        const sanitizedData = sanitizeProjectForStorage(newProject);

        projects.unshift(sanitizedData as Project); // Add new project to the beginning
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        return newProject;
    }

    deleteProject(id: string): void {
        let projects = this.getProjects();
        projects = projects.filter(p => p.id !== id);
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }
}

export const projectService = new ProjectService();
