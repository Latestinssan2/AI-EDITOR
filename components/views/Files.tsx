import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/projectService';
import { Project } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { toastService } from '../../services/toastService';

const ProjectCard: React.FC<{ project: Project, onLoad: (p: Project) => void, onDelete: (id: string) => void }> = ({ project, onLoad, onDelete }) => {
    const iconMap = {
        video: 'fa-video',
        slideshow: 'fa-images',
        photo: 'fa-camera-retro',
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete the project "${project.name}"?`)) {
            onDelete(project.id);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden group transition-transform transform hover:-translate-y-1">
            <div className="relative aspect-video bg-gray-700 flex items-center justify-center">
                {project.preview ? (
                    <img src={project.preview} alt={`${project.name} preview`} className="w-full h-full object-cover" />
                ) : (
                    <i className={`fas ${iconMap[project.type]} text-5xl text-gray-500`}></i>
                )}
                <div className="absolute inset-0 bg-black/20"></div>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-white truncate">{project.name}</h3>
                <p className="text-sm text-gray-400 capitalize">{project.type} Project</p>
                <p className="text-xs text-gray-500 mt-1">{new Date(project.createdAt).toLocaleString()}</p>
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={handleDelete} className="text-gray-400 hover:text-red-400 transition-colors" title="Delete Project">
                         <i className="fas fa-trash"></i>
                    </button>
                    <button onClick={() => onLoad(project)} className="px-4 py-2 text-sm bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700">
                        Load
                    </button>
                </div>
            </div>
        </div>
    );
};

const Files: React.FC = () => {
    const { setActiveView } = (window as any)._appContextForFiles; // A bit of a hack to get setActiveView
    const { setProjectToLoad } = useAppContext();
    const [projects, setProjects] = useState<Project[]>([]);

    const fetchProjects = () => {
        setProjects(projectService.getProjects());
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleLoadProject = (project: Project) => {
        setProjectToLoad(project);
        setActiveView(project.type);
    };

    const handleDeleteProject = (id: string) => {
        projectService.deleteProject(id);
        fetchProjects();
        toastService.success("Project deleted.");
    };
    
    const videoProjects = projects.filter(p => p.type === 'video');
    const slideshowProjects = projects.filter(p => p.type === 'slideshow');
    const photoProjects = projects.filter(p => p.type === 'photo');

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-6">My Projects</h1>
            {projects.length === 0 ? (
                <div className="text-center text-gray-500 mt-16">
                    <i className="fas fa-folder-open text-6xl mb-4"></i>
                    <p>You haven't saved any projects yet.</p>
                    <p className="text-sm">Go to an editor and click 'Save Project' to get started.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {videoProjects.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-semibold text-purple-400 mb-4">Video Projects</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {videoProjects.map(p => <ProjectCard key={p.id} project={p} onLoad={handleLoadProject} onDelete={handleDeleteProject} />)}
                            </div>
                        </div>
                    )}
                    {slideshowProjects.length > 0 && (
                         <div>
                            <h2 className="text-2xl font-semibold text-purple-400 mb-4">Slideshow Projects</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {slideshowProjects.map(p => <ProjectCard key={p.id} project={p} onLoad={handleLoadProject} onDelete={handleDeleteProject} />)}
                            </div>
                        </div>
                    )}
                     {photoProjects.length > 0 && (
                         <div>
                            <h2 className="text-2xl font-semibold text-purple-400 mb-4">AI Image Projects</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {photoProjects.map(p => <ProjectCard key={p.id} project={p} onLoad={handleLoadProject} onDelete={handleDeleteProject} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Files;
