import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import packageInfo from "../../package.json";

interface VersionDisplayProps {
  githubRelease: string;
}

export default function VersionDisplay({ githubRelease }: VersionDisplayProps) {
  return (
    <div className="flex m-4 md:m-0 md:fixed md:bottom-4 md:left-4 md:z-10">
      <Link target="_blank" href={githubRelease}>
        <Badge variant="outline" className="text-xs font-mono">
          {packageInfo.version}
        </Badge>
      </Link>
    </div>
  );
}
