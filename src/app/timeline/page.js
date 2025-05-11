import LaunchTimeline from '../../modules/timeline/components/LaunchTimeline';
import Admin from "../../components/layout/Admin";
export default function TimelinePage() {
  return (
    <Admin>
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-8">Launch Preparation Timeline</h1>
        <p className="text-gray-600 mb-8">
          Track our progress as we prepare for the official launch. This timeline shows key milestones
          and their current status in our journey to launch.
        </p>
        <LaunchTimeline />
      </div>
    </div>
    </Admin>
  );
} 