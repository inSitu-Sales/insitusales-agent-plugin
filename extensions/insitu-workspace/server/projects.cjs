"use strict";
const fs = require("node:fs/promises");
const { join, isAbsolute } = require("node:path");
const { createHash, randomUUID } = require("node:crypto");
const { validate } = require("./workspace.cjs");
const hash = value => createHash("sha256").update(value).digest("hex");
const string = maxLength => ({type:"string", minLength:1, maxLength});
const tools = [
  {name:"registerStorefrontProject", description:"Remember a user-approved local storefront folder for this device. Use the company ID obtained from authenticated discovery; this local label does not establish authorization. Register after creating or locating the project. Never store credentials.",
   inputSchema:{type:"object",properties:{companyId:{type:"string",pattern:"^[0-9]{1,20}$"},name:string(120),companyName:string(180),path:string(4096)},required:["companyId","name","path"],additionalProperties:false},
   annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false,idempotentHint:true},
   _meta:{ui:{visibility:["model"]}}},
  {name:"listStorefrontProjects",description:"Read this device's saved storefront folders and last known ZIP results. Local company labels are not authentication. Recheck files, ownership and fresh authorization before publication. Never automatically retry a saved uncertain upload.",
   inputSchema:{type:"object",properties:{},additionalProperties:false},
   annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false,idempotentHint:true},
   _meta:{ui:{visibility:["model","app"]}}}
];
// Keep credentials and arbitrary response payloads out of durable display records.
function displayResult(result) {
  const saved={};
  for (const key of ["status","hostname","code","outcome","attemptId","requestId","message","nextAction","stage","transportCode"]) {
    if(typeof result[key] === "string") saved[key]=result[key].slice(0,2048);
  }
  if(Number.isInteger(result.httpStatus)) saved.httpStatus=result.httpStatus;
  return saved;
}
function createProjectRegistry(dataRoot = process.env.PLUGIN_DATA) {
  function directory(kind) {
    if (!dataRoot || !isAbsolute(dataRoot)) throw Error("PLUGIN_DATA is unavailable. Reload the plugin in a supported desktop host.");
    return join(dataRoot,"storefronts-v1",kind);
  }
  const file = (kind,id) => {
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) throw Error("Invalid local record identity.");
    return join(directory(kind),id+".json");
  };
  async function read(kind,id) {
    const value=JSON.parse(await fs.readFile(file(kind,id),"utf8"));
    if (value.version!==1) throw Error("Unsupported local record version.");
    return value;
  }
  async function write(kind,id,value) {
    const target=file(kind,id);
    await fs.mkdir(directory(kind),{recursive:true,mode:0o700});
    const temporary=target+"."+randomUUID()+".tmp";
    try {
      await fs.writeFile(temporary,JSON.stringify({version:1,...value}),{mode:0o600,flag:"wx"});
      await fs.rename(temporary,target);
    } finally { await fs.rm(temporary,{force:true}); }
  }
  async function records(kind) {
    let names;
    try { names=await fs.readdir(directory(kind)); }
    catch(error) { if(error.code==="ENOENT") return []; throw error; }
    return Promise.all(names.filter(name=>/^[a-zA-Z0-9-]+\.json$/.test(name)).map(name=>read(kind,name.slice(0,-5))));
  }
  async function fileState(path,release) {
    try {
      const stat=await fs.stat(path);
      if (!release) return stat.isDirectory()?"available":"missing";
      if (!stat.isFile() || stat.size!==release.size || stat.size>10485760) return "changed";
      return hash(await fs.readFile(path))===release.digest?"available":"changed";
    } catch(error) { return error.code==="ENOENT"?"missing":"unavailable"; }
  }
  return {
    async register(args) {
      validate(tools[0].inputSchema,args);
      if (!isAbsolute(args.path)) throw Error("Use an absolute project folder.");
      const path=await fs.realpath(args.path);
      if (!(await fs.stat(path)).isDirectory()) throw Error("Select a project folder.");
      const id=hash(args.companyId+"\0"+path);
      const project={id,companyId:args.companyId,...(args.companyName ? {companyName:args.companyName} : {}),name:args.name,path,updatedAt:new Date().toISOString()};
      await write("projects",id,project);
      return project;
    },
    async get(id) { return read("projects",id); },
    async recordPrepared(projectId,artifactId,artifact) {
      await read("projects",projectId);
      await write("releases",artifactId,{artifactId,projectId,path:artifact.path,digest:artifact.digest,size:artifact.size,preparedAt:new Date().toISOString()});
    },
    async recordEvent(projectId, attemptId, result) {
      await read("projects",projectId);
      await write("events",attemptId,{projectId,...displayResult(result),recordedAt:new Date().toISOString()});
    },
    async recordResult(artifactId,result) {
      const release=await read("releases",artifactId);
      const saved={...displayResult(result),recordedAt:new Date().toISOString()};
      const confirmed=saved.status === "active" ? saved : release.confirmed || (release.result?.status === "active" ? release.result : undefined);
      await write("releases",artifactId,{...release,result:saved,...(confirmed ? {confirmed} : {})});
    },
    async list() {
      const [projects,releases,events]=await Promise.all([records("projects"),records("releases"),records("events")]);
      return Promise.all(projects.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(async project=>{
        const latestRelease=releases.filter(r=>r.projectId===project.id).sort((a,b)=>b.preparedAt.localeCompare(a.preparedAt)||b.artifactId.localeCompare(a.artifactId))[0];
        const results=[...releases.filter(r=>r.projectId===project.id && r.result).map(r=>r.result),...events.filter(e=>e.projectId===project.id)];
        const activity=results.sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt))[0];
        const lastPublication=results.find(r=>!["preparing","prepared"].includes(r.status));
        const lastConfirmedPublication=releases.filter(r=>r.projectId===project.id).map(r=>r.confirmed || (r.result?.status === "active" ? r.result : null)).filter(Boolean).sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt))[0];
        return {...project,activity,lastPublication,lastConfirmedPublication,folderState:await fileState(project.path),...(latestRelease?{latestRelease:{...latestRelease,fileState:await fileState(latestRelease.path,latestRelease)}}:{})};
      }));
    }
  };
}
function createProjectTools(registry) {
  return {tools,handles:name=>tools.some(tool=>tool.name===name),async call(name,args={}) {
    try {
      const tool=tools.find(t=>t.name===name);
      if(!tool) throw Error("Unknown project tool.");
      validate(tool.inputSchema,args);
      if(name==="registerStorefrontProject") await registry.register(args);
      const projects=await registry.list();
      return {structuredContent:{kind:"storefrontProjects",projects},content:[{type:"text",text:JSON.stringify({projects})}]};
    } catch {
      const message="Local projects could not be read or saved. Check the folder and plugin file permissions, then reload the plugin. You can continue in the chat without a saved project.";
      return {isError:true,structuredContent:{kind:"storefrontProjects",message},content:[{type:"text",text:message}]};
    }
  }};
}
module.exports={createProjectRegistry,createProjectTools};
