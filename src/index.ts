import * as tl from 'azure-pipelines-task-lib/task';
import * as tr from 'azure-pipelines-task-lib/toolrunner';
import * as dagger from './dagger';
import * as path from 'path';

async function run() {
  try {
    const version: string = tl.getInput("version") ?? "latest";
    const daggerBin = await dagger.install(version);

    const installOnly = tl.getBoolInput("installOnly");

    if (installOnly === true) {
      const daggerDir = path.dirname(daggerBin);
      tl.prependPath(daggerDir);
      tl.debug(`Added ${daggerDir} to PATH`);
      return;
    }

    const args = tl.getInput("args", true);
    if (args === undefined) {
      throw new Error("args is mandatory");
    }

    const workdir = tl.getPathInput("workingDirectory", true, true);
    let cmd = tl
      .tool(tl.which(daggerBin, true))
      .arg(args.split(" "))
      .arg(["--log-format", "plain"]);
    let options: tr.IExecOptions = {
      cwd: workdir,
      failOnStdErr: false,
      errStream: process.stdout, // Direct all output to STDOUT, otherwise the output may appear out
      outStream: process.stdout, // of order since Node buffers it's own STDOUT but not STDERR.
      ignoreReturnCode: true,
    };

    // exec
    const exitCode = await cmd.exec(options);

    let result = tl.TaskResult.Succeeded;

    process.on("SIGINT", () => {
      tl.debug("Started cancellation of executing script");
      cmd.killChildProcess();
    });

    // Fail on exit code.
    if (exitCode !== 0) {
      tl.error(`exitCode=${exitCode}`);
      result = tl.TaskResult.Failed;
    }

    tl.setResult(result, '', true);
  } catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();
