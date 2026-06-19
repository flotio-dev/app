"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/auth/AuthContext';
import { useCliModal } from '@/context/CliModalContext';
import { useRouter } from 'next/navigation';

const HELP_TEXT = `Flotio CLI is a command-line tool for managing Flotio cloud infrastructure,
deploying projects, and interacting with the Flotio platform.

Getting started:

  flotio project list
  flotio build start <project-id> --platform android --mode release

Use "flotio <command> --help" for details on any command.

Usage:
  flotio [command]

Examples:
  # List your projects
  flotio project list

  # Create a project and select it
  flotio create project "My App" --repo https://github.com/user/repo
  flotio select project "My App"
  flotio build start 1 --branch main --platform android --mode release

  # Manage signing keys
  flotio keystore create "release" --file keystore.jks --alias mykey

  # Manage Google Play credentials
  flotio play create "play-store" --file service-account.json

  # Manage environment variables
  flotio env create DATABASE_URL "postgres://..." --type env

Available Commands:
  build       Manage builds
  completion  Generate the autocompletion script for the specified shell
  config      Manage project configuration
  configure   Configure Flotio CLI defaults
  create      Create a project
  select      Select a project
  env         Manage environment variables and files
  flutter     Flutter version info
  github      Manage GitHub integration
  help        Help about any command
  keystore    Manage signing keystores
  logout      Log out from Flotio
  play        Manage Google Play credentials
  project     Manage projects
  update      Update flotio to the latest version
  version     Print version information
  whoami      Show the currently authenticated user

Flags:
      --config string   path to config file (default: $HOME/.flotio/config.yaml)
  -h, --help            help for flotio
      --host string     API host (default: api.flotio.ovh, accepts scheme://host e.g. http://localhost:8080)

Use "flotio [command] --help" for more information about a command.`;

function parseArgs(args: string[]) {
  const flags: Record<string, string> = {};
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = args[i + 1];
      if (val && !val.startsWith('-')) {
        flags[key] = val;
        i++;
      } else {
        flags[key] = 'true';
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      const val = args[i + 1];
      if (val && !val.startsWith('-')) {
        flags[key] = val;
        i++;
      } else {
        flags[key] = 'true';
      }
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

export default function CliTerminal({ onClose }: { onClose?: () => void } = {}) {
  const { request } = useApi();
  const { user, setUserAndToken, clearAuth } = useAuth();
  const { projectId: contextProjectId, setProjectId } = useCliModal();
  const router = useRouter();

  const handleProjectClick = (id: string | number) => {
    setProjectId(String(id));
    router.push(`/projects/${id}`);
  };
  const [projectName, setProjectName] = useState<string>("");

  useEffect(() => {
    if (!contextProjectId) {
      setProjectName("");
      return;
    }
    const fetchProjectName = async () => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      if (!apiBaseUrl) return;
      try {
        const res = await request(`${apiBaseUrl}/project/${contextProjectId}`);
        if (res.ok) {
          const data = await res.json();
          const pName = data.name || data.project?.name || `Project ${contextProjectId}`;
          setProjectName(pName);
        } else {
          setProjectName(`Project ${contextProjectId}`);
        }
      } catch {
        setProjectName(`Project ${contextProjectId}`);
      }
    };
    fetchProjectName();
  }, [contextProjectId, request]);

  const [height, setHeight] = useState(350);
  const isDragging = useRef(false);
  const [lastHeight, setLastHeight] = useState(350);
  const isMinimized = height <= 80;

  const [interactiveSession, setInteractiveSession] = useState<{
    type: 'init';
    step: 'choose_option' | 'project_name' | 'git_repo';
    projects: Array<{ id: number; name: string }>;
    tempProjectName?: string;
  } | null>(null);

  const getPrompt = () => {
    if (interactiveSession) {
      if (interactiveSession.step === 'choose_option') return 'Choose an option: ';
      if (interactiveSession.step === 'project_name') return 'Project name: ';
      if (interactiveSession.step === 'git_repo') return 'Git repo URL (optional): ';
    }
    return '$ ';
  };

  const handleInteractiveInput = async (userInput: string, currentLines: React.ReactNode[]) => {
    if (!interactiveSession) return;

    if (interactiveSession.step === 'choose_option') {
      const choice = userInput.trim().toLowerCase();

      if (choice === 'q') {
        currentLines.push(<div key={currentLines.length} className="output">Quitting.</div>);
        setLines(currentLines);
        setInteractiveSession(null);
        return;
      }

      if (choice === 'n') {
        currentLines.push(<div key={currentLines.length} className="output">\nCreate a new project</div>);
        setLines(currentLines);
        setInteractiveSession({
          ...interactiveSession,
          step: 'project_name',
        });
        return;
      }

      const index = parseInt(choice, 10);
      if (!isNaN(index) && index >= 1 && index <= interactiveSession.projects.length) {
        const selectedProject = interactiveSession.projects[index - 1];
        currentLines.push(
          <div key={currentLines.length} className="output">
            ✓ Project "{selectedProject.name}" (ID: {selectedProject.id}) selected and initialized.
          </div>
        );
        setLines(currentLines);
        setInteractiveSession(null);
        return;
      }

      // Invalid option
      currentLines.push(
        <div key={currentLines.length} className="output" style={{ color: '#f87171' }}>
          Invalid option. Please choose a number, 'n', or 'q'.
        </div>
      );
      setLines(currentLines);
      return;
    }

    if (interactiveSession.step === 'project_name') {
      const projectName = userInput.trim();
      if (projectName === '') {
        currentLines.push(
          <div key={currentLines.length} className="output" style={{ color: '#f87171' }}>
            Project name cannot be empty.
          </div>
        );
        setLines(currentLines);
        return;
      }

      setLines(currentLines);
      setInteractiveSession({
        ...interactiveSession,
        step: 'git_repo',
        tempProjectName: projectName,
      });
      return;
    }

    if (interactiveSession.step === 'git_repo') {
      const gitRepo = userInput.trim();
      const projectName = interactiveSession.tempProjectName || "New Project";

      currentLines.push(<div key={currentLines.length} className="output">\nCreating project...</div>);
      setLines([...currentLines]);

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      if (!apiBaseUrl) {
        currentLines.push(<div key={currentLines.length + 1} className="output" style={{ color: '#f87171' }}>Error: NEXT_PUBLIC_API_URL is not configured.</div>);
        setLines(currentLines);
        setInteractiveSession(null);
        return;
      }

      try {
        const res = await request(`${apiBaseUrl}/project`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: projectName,
            build_folder: ".",
            flutter_version: "3.19.0",
            git_repo: gitRepo || "",
            git_token: "",
            git_username: "",
            config: {
              project_path: ".",
              flutter_version: "3.19.0",
              git_repo: gitRepo || "",
              git_token: "",
              git_username: "",
            },
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to create project via API");
        }

        const newProj = await res.json();
        const newId = newProj.id ?? newProj.project_id ?? "unknown";

        currentLines.push(
          <div key={currentLines.length + 2} className="output" style={{ color: '#4ade80' }}>
            ✓ Project "{projectName}" (ID: {newId}) successfully created and initialized!
          </div>
        );
        setLines(currentLines);
      } catch (err: any) {
        currentLines.push(
          <div key={currentLines.length + 2} className="output" style={{ color: '#f87171' }}>
            Error creating project: {err.message || "Unknown error."}
          </div>
        );
        setLines(currentLines);
      } finally {
        setInteractiveSession(null);
      }
    }
  };

  const toggleMinimize = () => {
    if (isMinimized) {
      setHeight(lastHeight);
    } else {
      setLastHeight(height);
      setHeight(76);
    }
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const newHeight = window.innerHeight - e.clientY;
    if (newHeight >= 76 && newHeight <= window.innerHeight * 0.9) {
      setHeight(newHeight);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const [lines, setLines] = useState<React.ReactNode[]>([
    'Welcome to Flotio CLI!',
    "Type 'flotio help' to see available commands.",
    <br key="br-init" />,
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView();
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const callApi = async (commandLine: string): Promise<React.ReactNode> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const parts = commandLine.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return "";

    const command = parts[0];
    const args = parts.slice(1);

    if (command === "help") {
      return HELP_TEXT;
    }

    if (command === "date") {
      return new Date().toString();
    }

    if (command === "whoami" && args.length === 0) {
      if (user) {
        return `user: ${user.username} (${user.email})`;
      }
      return "Not authenticated. Please run \"flotio login\" first.";
    }

    if (command === "flotio") {
      const { positional, flags } = parseArgs(args);
      const action = positional[0];

      if (!action || action === "help" || flags.help || flags.h) {
        return HELP_TEXT;
      }

      if (action === "version") {
        return "flotio version 1.0.0 (darwin/arm64)";
      }

      if (action === "whoami") {
        if (user) {
          return `user: ${user.username} (${user.email})`;
        }
        return "Not authenticated. Please run \"flotio login\" first.";
      }


      if (action === "logout") {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
        }
        clearAuth();
        return "Success: Logged out.";
      }

      if (action === "create") {
        const subAction = positional[1];
        if (subAction === "project") {
          if (!user) {
            return "Error: Not authenticated.";
          }

          const name = positional[2];
          if (!name) {
            return 'Error: Project name is required. Example: flotio create project "My App"';
          }

          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
          if (!apiBaseUrl) return "Error: NEXT_PUBLIC_API_URL is not configured.";

          const gitRepo = flags.repo || flags.git_repo || "";

          try {
            const res = await request(`${apiBaseUrl}/project`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: name,
                build_folder: ".",
                flutter_version: "3.19.0",
                git_repo: gitRepo,
                git_token: "",
                git_username: "",
                config: {
                  project_path: ".",
                  flutter_version: "3.19.0",
                  git_repo: gitRepo,
                  git_token: "",
                  git_username: "",
                },
              }),
            });

            if (!res.ok) {
              const text = await res.text();
              return `Error creating project: ${text || res.statusText} (Status: ${res.status})`;
            }

            const newProj = await res.json();
            const newId = newProj.id ?? newProj.project_id;
            
            if (newId) {
              handleProjectClick(newId);
              return `✓ Project "${name}" (ID: ${newId}) successfully created, initialized and selected!`;
            }
            return `✓ Project "${name}" successfully created!`;
          } catch (err: any) {
            return `Error: ${err.message || "An unexpected error occurred."}`;
          }
        }
        return `Error: Unknown create action "${subAction || ""}". Try "flotio create project <name>"`;
      }

      if (action === "select") {
        const subAction = positional[1];
        if (subAction === "project") {
          if (!user) {
            return "Error: Not authenticated.";
          }

          const target = positional[2] || flags.id || flags.name;
          if (!target) {
            return 'Error: Project name or ID is required. Example: flotio select project "My App" or flotio select project 12';
          }

          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
          if (!apiBaseUrl) return "Error: NEXT_PUBLIC_API_URL is not configured.";

          try {
            const res = await request(`${apiBaseUrl}/project`);
            if (!res.ok) {
              return `Error: Failed to fetch projects (status: ${res.status})`;
            }
            const data = await res.json();
            let projects: any[] = [];
            if (Array.isArray(data)) {
              projects = data;
            } else if (data && typeof data === "object") {
              projects = Array.isArray(data.projects) ? data.projects : [];
            }

            // Find project by ID or by name
            const targetStr = String(target).trim();
            let foundProject = projects.find(p => String(p.id ?? p.project_id) === targetStr);

            if (!foundProject) {
              foundProject = projects.find(
                p => p.name && p.name.trim().toLowerCase() === targetStr.toLowerCase()
              );
            }

            if (!foundProject) {
              foundProject = projects.find(
                p => p.name && p.name.trim().toLowerCase().includes(targetStr.toLowerCase())
              );
            }

            if (foundProject) {
              const pid = foundProject.id ?? foundProject.project_id;
              handleProjectClick(pid);
              return `✓ Selected project "${foundProject.name}" (ID: ${pid}).`;
            }

            return `Error: Project "${target}" not found.`;
          } catch (err: any) {
            return `Error: ${err.message || "An unexpected error occurred."}`;
          }
        }
        return `Error: Unknown select action "${subAction || ""}". Try "flotio select project <name-or-id>"`;
      }

      if (action === "project") {
        const subAction = positional[1];
        if (subAction === "list") {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
          if (!apiBaseUrl) return "Error: NEXT_PUBLIC_API_URL is not configured.";

          try {
            const res = await request(`${apiBaseUrl}/project`);
            if (!res.ok) {
              return `Error: Failed to fetch projects (status: ${res.status})`;
            }
            const data = await res.json();
            let projects: any[] = [];
            if (Array.isArray(data)) {
              projects = data;
            } else if (data && typeof data === "object") {
              projects = Array.isArray(data.projects) ? data.projects : [];
            }

            if (projects.length === 0) {
              return "No projects found.";
            }

            return (
              <div className="cli-table-wrapper">
                <style jsx>{`
                  .cli-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                    font-family: inherit;
                    font-size: 13px;
                    color: #d4d4d4;
                  }
                  .cli-table th {
                    text-align: left;
                    padding: 8px 12px;
                    background-color: #252526;
                    color: #858585;
                    font-weight: 600;
                    border-bottom: 1px solid #2d2d2d;
                    text-transform: uppercase;
                    font-size: 11px;
                    letter-spacing: 0.05em;
                  }
                  .cli-table td {
                    padding: 8px 12px;
                    border-bottom: 1px solid #252526;
                  }
                  .cli-table tr:hover {
                    background-color: #2a2d2e;
                  }
                  .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                  }
                  .badge-ready {
                    background-color: rgba(39, 201, 63, 0.15);
                    color: #4ade80;
                  }
                  .badge-building {
                    background-color: rgba(251, 146, 60, 0.15);
                    color: #fb923c;
                  }
                  .badge-failed {
                    background-color: rgba(239, 68, 68, 0.15);
                    color: #f87171;
                  }
                  .badge-unknown {
                    background-color: rgba(156, 163, 175, 0.15);
                    color: #9ca3af;
                  }
                  .repo-link {
                    color: #569cd6;
                    text-decoration: none;
                  }
                  .repo-link:hover {
                    text-decoration: underline;
                  }
                `}</style>
                <table className="cli-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Git Repository</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p: any) => {
                      const id = p.id ?? p.project_id ?? "";
                      const name = p.name ?? "";
                      const status = (p.status ?? "UNKNOWN").toUpperCase();
                      const repo = p.git_repo ?? "None";

                      let badgeClass = "badge-unknown";
                      if (status === "READY" || status === "SUCCESS") badgeClass = "badge-ready";
                      else if (status === "BUILDING" || status === "PENDING") badgeClass = "badge-building";
                      else if (status === "FAILED" || status === "ERROR") badgeClass = "badge-failed";

                      return (
                        <tr 
                          key={id} 
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleProjectClick(id)}
                          title="Click to select project context"
                        >
                          <td style={{ color: '#ce9178' }}>{id}</td>
                          <td style={{ fontWeight: 600 }}>{name}</td>
                          <td>
                            <span className={`badge ${badgeClass}`}>
                              <span style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: status === "READY" || status === "SUCCESS" ? '#4ade80' : (status === "BUILDING" || status === "PENDING" ? '#fb923c' : (status === "FAILED" || status === "ERROR" ? '#f87171' : '#9ca3af'))
                              }} />
                              {status}
                            </span>
                          </td>
                          <td>
                            {repo !== "None" ? (
                              <a href={repo} target="_blank" rel="noopener noreferrer" className="repo-link" onClick={(e) => e.stopPropagation()}>
                                {repo}
                              </a>
                            ) : (
                              <span style={{ color: '#858585' }}>None</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          } catch (err: any) {
            return `Error: ${err.message || "An unexpected error occurred."}`;
          }
        }
        return `Error: Unknown project action "${subAction || ""}". Try "flotio project list"`;
      }

      if (action === "env") {
        const subAction = positional[1];
        if (subAction === "list") {
          const projectId = positional[2] || flags.project || flags.project_id || contextProjectId;

          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
          if (!apiBaseUrl) return "Error: NEXT_PUBLIC_API_URL is not configured.";

          try {
            const url = projectId ? `${apiBaseUrl}/env?project_id=${projectId}` : `${apiBaseUrl}/env`;
            const res = await request(url);
            if (!res.ok) {
              return `Error: Failed to fetch env variables (status: ${res.status})`;
            }
            const data = await res.json();
            
            // Extract env variables
            let envs: any[] = [];
            if (Array.isArray(data?.envs)) envs = data.envs;
            else if (Array.isArray(data)) envs = data;
            else if (data && typeof data === "object") {
              envs = Object.values(data).flatMap((value) =>
                Array.isArray(value) ? value : value ? [value] : []
              );
            }

            if (envs.length === 0) {
              return projectId ? `No environment variables found for project ${projectId}.` : "No environment variables found.";
            }

            return (
              <div className="cli-table-wrapper">
                <style jsx>{`
                  .cli-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                    font-family: inherit;
                    font-size: 13px;
                    color: #d4d4d4;
                  }
                  .cli-table th {
                    text-align: left;
                    padding: 8px 12px;
                    background-color: #252526;
                    color: #858585;
                    font-weight: 600;
                    border-bottom: 1px solid #2d2d2d;
                    text-transform: uppercase;
                    font-size: 11px;
                    letter-spacing: 0.05em;
                  }
                  .cli-table td {
                    padding: 8px 12px;
                    border-bottom: 1px solid #252526;
                  }
                  .cli-table tr:hover {
                    background-color: #2a2d2e;
                  }
                  .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                  }
                  .badge-env {
                    background-color: rgba(86, 156, 214, 0.15);
                    color: #569cd6;
                  }
                  .badge-file {
                    background-color: rgba(156, 220, 254, 0.15);
                    color: #9cdcfe;
                  }
                `}</style>
                <table className="cli-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Key</th>
                      <th>Value</th>
                      <th>Type</th>
                      <th>Path</th>
                      <th>Base64</th>
                    </tr>
                  </thead>
                  <tbody>
                    {envs.map((env: any) => {
                      const id = env.id ?? env.ID ?? "";
                      const key = env.key ?? "";
                      const val = env.value ?? "";
                      const maskedValue = val.length > 8 ? `${val.substring(0, 3)}...${val.substring(val.length - 3)}` : "••••••••";
                      const type = (env.type ?? "env").toLowerCase();
                      const path = env.path ?? "-";
                      const isBase64 = env.is_base64 || env.isBase64 ? "YES" : "NO";

                      return (
                        <tr key={id || key}>
                          <td style={{ color: '#ce9178' }}>{id}</td>
                          <td style={{ color: '#4ade80', fontWeight: 600 }}>{key}</td>
                          <td style={{ fontFamily: 'monospace', color: '#ce9178' }}>{maskedValue}</td>
                          <td>
                            <span className={`badge ${type === "file" ? "badge-file" : "badge-env"}`}>
                              {type}
                            </span>
                          </td>
                          <td style={{ color: '#d4d4d4' }}>{path}</td>
                          <td style={{ color: isBase64 === "YES" ? '#fb923c' : '#858585' }}>{isBase64}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          } catch (err: any) {
            return `Error: ${err.message || "An unexpected error occurred."}`;
          }
        }
        return `Error: Unknown env action "${subAction || ""}". Try "flotio env list <project-id>"`;
      }

      if (action === "build") {
        const subAction = positional[1];
        if (subAction === "start") {
          const projectId = positional[2] || contextProjectId;
          if (!projectId) {
            return "Error: Project ID is required. Example: flotio build start <project-id>";
          }

          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
          if (!apiBaseUrl) return "Error: NEXT_PUBLIC_API_URL is not configured.";

          const platform = flags.platform || "android";
          const build_mode = flags.mode || flags.environment || "release";
          const git_branch = flags.branch || flags.ref || "main";

          try {
            const payload = {
              build_mode: build_mode.toLowerCase(),
              build_target: "apk",
              platform: platform.toLowerCase(),
              git_branch: git_branch.toLowerCase(),
              flutter_channel: "stable",
            };

            const res = await request(`${apiBaseUrl}/project/${projectId}/build`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!res.ok) {
              const errorText = await res.text();
              return `Error starting build: ${errorText || res.statusText} (Status: ${res.status})`;
            }

            return `Success: Build successfully started for project ${projectId}.`;
          } catch (err: any) {
            return `Error: ${err.message || "An unexpected error occurred."}`;
          }
        }
        return `Error: Unknown build action "${subAction || ""}". Try "flotio build start <project-id>"`;
      }

      return `Command "flotio ${action}" is not implemented yet. Try running:
  - flotio logout
  - flotio whoami
  - flotio project list
  - flotio build start <project-id> --platform android --mode release`;
    }

    return `Command not found: ${command}. Type 'flotio help' for help.`;
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const commandLine = input; // Keep spaces and empty input for optional skips
    if (commandLine.trim() === '' && (!interactiveSession || interactiveSession.step !== 'git_repo')) {
      return;
    }

    const newLines: React.ReactNode[] = [
      ...lines,
      <div key={lines.length}>
        <span className="prompt">{getPrompt()}</span>{commandLine}
      </div>,
    ];

    if (interactiveSession) {
      setInput('');
      await handleInteractiveInput(commandLine, newLines);
      return;
    }

    const trimmedCmd = commandLine.trim();
    const parts = trimmedCmd.split(/\s+/);
    const command = parts[0];

    if (command === 'clear') {
      setLines([]);
    } else {
      const output = await callApi(trimmedCmd);
      const renderedOutput = typeof output === 'string' ? (
        output.split('\n').map((line, i) => <div key={i}>{line}</div>)
      ) : (
        output
      );
      newLines.push(
        <div key={lines.length + 1} className="output">
          {renderedOutput}
        </div>
      );
      setLines(newLines);
    }
    
    setHistory(prev => [trimmedCmd, ...prev]);
    setHistoryIndex(-1);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' && historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setInput(history[newIndex]);
    } else if (e.key === 'ArrowDown' && historyIndex > -1) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setInput(newIndex >= 0 ? history[newIndex] : '');
    }
  };

  return (
    <>
      <style jsx>{`
        .drawer-container {
          position: fixed;
          bottom: 0;
          left: 256px;
          right: 0;
          background-color: #1e1e1e;
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.3);
          z-index: 1200;
          display: flex;
          flex-direction: column;
          font-family: 'Menlo', 'Monaco', 'Consolas', 'Courier New', monospace;
          color: #d4d4d4;
          border-top: 1px solid #3c3c3c;
          overflow: hidden;
        }
        .drag-handle {
          height: 6px;
          cursor: ns-resize;
          background-color: transparent;
          position: absolute;
          top: -3px;
          left: 0;
          right: 0;
          z-index: 1201;
        }
        .drag-handle:hover, .drag-handle:active {
          background-color: #818cf8;
          transition: background-color 0.2s;
        }
        .header {
          background-color: #252526;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          user-select: none;
          height: 36px;
          border-bottom: 1px solid #2d2d2d;
        }
        .title {
          color: #9e9e9e;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .action-btn {
          background: none;
          border: none;
          color: #858585;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s, color 0.2s;
        }
        .action-btn:hover {
          background-color: #37373d;
          color: #ffffff;
        }
        .terminal {
          flex-grow: 1;
          padding: 10px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          font-size: 14px;
          line-height: 1.5;
          cursor: text;
        }
        .prompt {
          color: #569cd6;
          margin-right: 8px;
          white-space: pre;
        }
        .output {
          white-space: pre-wrap;
          color: #ce9178;
        }
        .inputLine {
          display: flex;
          align-items: center;
        }
        .input {
          background: none;
          border: none;
          color: #d4d4d4;
          font-family: inherit;
          font-size: inherit;
          flex-grow: 1;
          outline: none;
          padding: 0;
        }
      `}</style>
      <div className="drawer-container" style={{ height: `${height}px` }}>
        <div className="drag-handle" onMouseDown={startResize} />
        <div className="header">
          <div className="title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            flotio-cli
            {projectName && (
              <span style={{ 
                color: '#4ade80', 
                fontSize: '11px', 
                backgroundColor: 'rgba(74, 222, 128, 0.15)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                textTransform: 'none'
              }}>
                {projectName}
              </span>
            )}
          </div>
          <div className="header-actions">
            <button className="action-btn" onClick={toggleMinimize} title={isMinimized ? "Agrandir" : "Réduire au minimum"}>
              {isMinimized ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="terminal" onClick={() => inputRef.current?.focus()}>
          {!isMinimized && lines}
          <form onSubmit={handleCommandSubmit}>
            <div className="inputLine">
              <span className="prompt">{getPrompt()}</span>
              <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} className="input" autoComplete="off" />
            </div>
          </form>
          {!isMinimized && <div ref={terminalEndRef} />}
        </div>
      </div>
    </>
  );
}
