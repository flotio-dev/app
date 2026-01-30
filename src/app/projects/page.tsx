import SideMenu from '../../components/common/SideMenu';
import ProjectsHeader from '../../components/projects/ProjectsHeader';
import ListingProjects from '../../components/projects/ListingProjects';

export default function ProjectsPage() {
  return (
    <div className="min-h-screen flex">
      <div className="fixed left-0 top-0 h-screen w-64 z-30">
        <SideMenu />
      </div>
      <main className="flex-1 flex flex-col min-h-screen" style={{ paddingLeft: 256 }}>
        <header className="h-16 flex items-center px-6 border-b border-border">
          <ProjectsHeader />
        </header>
        <div className="py-10 px-8">
          <ListingProjects />
        </div>
      </main>
    </div>
  );
}
