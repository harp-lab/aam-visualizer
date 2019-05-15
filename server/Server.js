const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs-extra');
const util = require('util');
const child_process = require('child_process');

const Consts = require('./Consts.js');
const G = require('./Global.js');
const Project = require('./Project.js');

class Server
{
  constructor()
  {
    this.projects = {};
    this.initData();
    this.initServer();
    this.initWatcher();
  }
  initServer()
  {
    this.server = http.createServer((req, res) =>
    {
      G.log(Consts.LOG_TYPE_HTTP, `${req.method} ${req.url}`);
      let parts = url.parse(req.url, true);
      switch (parts.pathname)
      {
        case '/api/project':
          this.handleProjectReq(req, res);
          break;
        default:
          let filePath = './build' + parts.path;
          if (filePath == './build/')
            filePath = './build/index.html';
          let ext = String(path.extname(filePath)).toLowerCase();
          let mimeTypes =
          {
            '.html': 'text/html',
            '.js':'text/javascript',
            '.css': 'text/css'
          };
          let contentType = mimeTypes[ext] || 'application/octet-stream';
          fs.readFile(filePath, (error, content) =>
          {
            if (error)
            {
              if (error.code == 'ENOENT')
                this.invalidReq(res, 404, 'GET', parts.path);
              else
              {
                G.log(Consts.LOG_TYPE_HTTP, `500 ${parts.path}`);
                res.writeHead(500, Consts.HEADERS);
                res.end();
              }
            }
            else
            {
              let newHeaders = Object.assign(Consts.HEADERS, {'Content-Type': contentType});
              res.writeHead(200, newHeaders);
              res.end(content);
            }
          });
          break;
      }
    });
    
    this.server.listen(Consts.PORT, Consts.HOSTNAME, () => 
    G.log(Consts.LOG_TYPE_INIT, `server running (http://${Consts.HOSTNAME}:${Consts.PORT})`));
  }
  initWatcher()
  {
    this.watcher = child_process.spawn('racket', [`${Consts.ENGINE_DIR}/watcher.rkt`], 
    {
      cwd: Consts.ENGINE_DIR,
    });
    
    this.watcher.stdout.setEncoding('utf8');
    this.watcher.stdout.on('data', (data) => {
      console.log(data.trim());
    });
    this.watcher.stderr.setEncoding('utf8');
    this.watcher.stderr.on('data', (data) => {
      let output = data.trim();
      G.log(Consts.LOG_TYPE_WATCHER, `ERROR: ${output}`);
    });
    this.watcher.on('close', (code) => {
      G.log(Consts.LOG_TYPE_WATCHER, `crashed (${code}) - restarting`);
      this.initWatcher();
    });
    G.log(Consts.LOG_TYPE_INIT, `starting watcher`);
  }
  
  // request handlers
  handleProjectReq(req, res)
  {
    let parts = url.parse(req.url, true);
    let query = parts.query;
    let projId = query.id;
    
    if (projId !== undefined)
    {
      if (this.isProject(projId))
      {
        let proj = this.getProject(projId);
        switch (req.method)
        {
          case 'POST':
            if (query.save !== undefined)
            {
              let dataString = '';
              req.on('data', chunk =>
              {
                dataString += chunk.toString();
              });
              req.on('end', () =>
              {
                let data = JSON.parse(dataString);
                this.saveProject(projId, data);
                
                res.writeHead(202, Consts.HEADERS);
                res.end();
              });
            }
            else if (query.process !== undefined)
            {
              let proj = this.getProject(projId);
              this.processProject(projId);
              
              res.writeHead(200, Consts.HEADERS);
              res.end();
            }
            else
              this.invalidReq(res, 400, req.method, 'invalid query');
            break;
          case 'GET':
            if (query.code !== undefined)
            {
              let code = proj.getCode();
              let newHeaders = Object.assign(Consts.HEADERS, {'Content-Type': 'application/json'});
              res.writeHead(200, newHeaders);
              res.end(JSON.stringify({id: projId, code: code}));
            }
            else if (query.data !== undefined)
            {
              switch (proj.getStatus())
              {
                case proj.STATUSES.done:
                case proj.STATUSES.error:
                  let code = proj.getCode();
                  let status = proj.getStatus();
                  let newHeaders = Object.assign(Consts.HEADERS, {'Content-Type': 'application/json'});
                  res.writeHead(200, newHeaders);
                  res.end(JSON.stringify(
                  {
                    id: projId,
                    graphs: proj.getGraphs(),
                    code: code,
                    status: status
                  }));
                  break;
                case proj.STATUSES.process:
                  res.writeHead(204, Consts.HEADERS);
                  res.end();
                  break;
                default:
                  res.writeHead(412, Consts.HEADERS);
                  res.end();
                  break;
              }
            }
            else
              this.invalidReq(res, 400, req.method, 'invalid query');
            break;
          case 'OPTIONS':
            let newHeaders = Object.assign(Consts.HEADERS, {'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, DELETE'});
            res.writeHead(200, newHeaders);
            res.end();
            break;
          case 'DELETE':
            this.deleteProject(projId);
            res.writeHead(205, Consts.HEADERS);
            res.end();
            break;
          default:
            this.invalidReq(res, 405, req.method, req.url)
            break;
        }
      }
      else
        this.invalidReq(res, 404, req.method, `project ${projId} not found`);
    }
    else
      switch (req.method)
      {
        case 'GET':
          if (query.create !== undefined)
          {
            let newProjId = this.createProject();
            let newHeaders = Object.assign(Consts.HEADERS, {'Content-Type': 'application/json'});
            res.writeHead(201, newHeaders);
            res.end(JSON.stringify({id: newProjId}));
          }
          else if (query.all !== undefined)
          {
            let newHeaders = Object.assign(Consts.HEADERS, {'Content-Type': 'application/json'});
            res.writeHead(200, newHeaders);
            res.end(JSON.stringify(this.getProjectList()));
          }
          else
            this.invalidReq(res, 400, req.method, 'invalid query');
          break;
        default:
          this.invalidReq(res, 405, req.method, req.url);
          break;
      }
  }
  handleReq(req, res, reqPath, reqMethod, reqQuery, func)
  {
    let parts = url.parse(req.url, true);
    let query = parts.query;
    
    if (parts.path == reqPath && req.method == reqMethod && query[reqQuery] !== undefined)
      func();
  }
  invalidReq(res, statusCode, reqMethod, desc = '')
  {
    let content = `${statusCode} bad ${reqMethod} request`;
    if (desc !== '')
      content += ` - ${desc}`;
    G.log(Consts.LOG_TYPE_HTTP, content);
    res.writeHead(statusCode, Consts.HEADERS);
    res.end();
  }
  
  // project handlers
  createProject()
  {
    let projId = `${Date.now()}`;
    G.log(Consts.LOG_TYPE_PROJ, `${projId} - creating`);
    this.addProject(projId);
    return projId;
  }
  addProject(projId)
  {
    let proj = new Project();
    this.projects[projId] = proj;
    return proj;
  }
  saveProject(projId, data)
  {
    G.log(Consts.LOG_TYPE_PROJ, `${projId} - saving`);
    let proj  = this.getProject(projId);
    let name = data.name;
    let code = data.code;
    switch (proj.getStatus())
    {
      case proj.STATUSES.empty:
      case proj.STATUSES.edit:
        if (code !== undefined)
          proj.importCode(code);
      default:
        if (name !== undefined)
          proj.setName(name);
        this.writeProject(projId);
        break;
    }
  }
  deleteProject(projId)
  {
    G.log(Consts.LOG_TYPE_PROJ, `${projId} - deleting`);
    delete this.projects[projId];
    fs.remove(`${Consts.SAVE_DIR}/${projId}`);
    fs.remove(`${Consts.INPUT_DIR}/${projId}`);
    fs.remove(`${Consts.OUTPUT_DIR}/${projId}`);
  }
  processProject(projId)
  {
    G.log(Consts.LOG_TYPE_PROJ, `${projId} - submitting`);
    let proj = this.getProject(projId);
    switch (proj.getStatus())
    {
      case proj.STATUSES.empty:
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projId} - cannot process empty project`);
        break;
      case proj.STATUSES.edit:
        proj.setStatus(proj.STATUSES.process);
        this.writeProject(projId, Consts.INPUT_DIR);
        fs.remove(`${Consts.SAVE_DIR}/${projId}`);
        this.checkProject(projId);
        break;
      default:
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projId} - immutable`);
        break;
    }
  }
  checkProject(projId)
  {
    G.log(Consts.LOG_TYPE_PROJ, `${projId} - checking processing status`);
    this.readProject(Consts.OUTPUT_DIR, projId, (projId) =>
    {
      let proj = this.getProject(projId);
      switch (proj.getStatus())
      {
        case proj.STATUSES.process:
          G.log(Consts.LOG_TYPE_PROJ, `${projId} - processing`)
          setTimeout(() => this.checkProject(projId), 1000);
          break;
        case proj.STATUSES.done:
          G.log(Consts.LOG_TYPE_PROJ, `${projId} - done`);
          break;
        default:
          G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projId} - invalid status to check`);
          break;
      }
    });
  }
  getProject(projId)
  {
    return this.projects[projId];
  }
  isProject(projId)
  {
    return this.projects[projId] !== undefined;
  }
  getProjectList()
  {
    let list = {};
    for (let projId in this.projects)
    {
      let proj = this.getProject(projId);
      list[projId] =
      {
        status: proj.getStatus(),
        name: proj.getName()
      };
    }
    return list;
  }
  
  // file system handlers
  initData(func)
  {
    if (Consts.INIT_DATA)
    {
      G.log(Consts.LOG_TYPE_INIT, 'clearing data');
      fs.removeSync(Consts.DATA_DIR);
    }
    G.log(Consts.LOG_TYPE_INIT, 'initializing data');
    fs.ensureDirSync(Consts.OUTPUT_DIR);
    fs.ensureDirSync(Consts.INPUT_DIR);
    fs.ensureDirSync(Consts.SAVE_DIR);
    this.readProjectDir(Consts.OUTPUT_DIR);
    this.readProjectDir(Consts.INPUT_DIR, (projId) =>
    {
      this.checkProject(projId);
    });
    this.readProjectDir(Consts.SAVE_DIR);
  }
  writeProject(projId, dirPath)
  {
    let proj = this.getProject(projId);
    // if no new dirPath, get set dirPath
    if (dirPath == undefined)
      dirPath = proj.getDirPath();
    else
      proj.setDirPath(dirPath);
    
    let filePath = `${dirPath}/${projId}`;
    let output = {};
    switch (proj.getStatus())
    {
      case proj.STATUSES.done:
        output.graphs = proj.getGraphs();
      default:
        output.id = projId;
        output.name = proj.getName();
        output.code = proj.getCode();
        output.status = proj.getStatus();
        break;
    }
    
    fs.writeFile(filePath, JSON.stringify(output), 'utf8', (error) =>
    {
      if (error)
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projId} - write failed`);
    });
  }
  readProjectDir(dirPath, projFunc = (projId)=>{})
  {
    let projList = fs.readdirSync(dirPath);
    projList.forEach((projId) =>
    {
      if (this.isProject(projId))
        G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projId} - already imported`);
      else
      {
        let proj = this.addProject(projId);
        this.readProject(dirPath, projId, projFunc);
      }
    });
  }
  readProject(dirPath, projId, projFunc = (projId)=>{})
  {
    let proj = this.getProject(projId);
    fs.readFile(`${dirPath}/${projId}`,
    {
      encoding: 'utf-8'
    }, (error, dataString) =>
    {
      if (error)
      {
        if (error.code == 'ENOENT')
        {
          G.log(Consts.LOG_TYPE_PROJ, `${projId} - not found`);
          projFunc(projId);
        }
        else
          G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projId} - read failed`);
      }
      else
      {
        let data = JSON.parse(dataString);
        if (data.id == projId)
        {
          proj.setDirPath(dirPath);
          proj.setName(data.name);
          proj.setStatus(proj.STATUSES.edit);
          proj.importCode(data.code);
          if (data.graphs && Object.entries(data.graphs).length > 0)
          {
            proj.setStatus(proj.STATUSES.process);
            proj.importGraphs(data.graphs);
          }
          proj.setStatus(data.status);
          projFunc(projId);
        }
        else
          G.log(Consts.LOG_TYPE_SYS, `ERROR: project ${projId} - data id (${data.id}) mismatch`);
      }
    }
    );
  }
}

module.exports = Server;
