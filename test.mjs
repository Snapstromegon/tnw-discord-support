import { spawn } from "child_process";
import buntstift from 'buntstift';

const [command] = process.argv.slice(2);

const DOCKER_STATUS_CONTAINER_ALREADY_EXISTS = 125;

// const runCommand = async (command, args) => {
//   return new Promise((resolve, reject) => {
//     const child = spawn(command, args, {stdio: "inherit"});
//     child.on("close", (code) => {
//       resolve(code);
//     });
//     child.on("stdout", (data) => {
//       console.log(data.toString());
//     });
//   });
// };

async function runCommand(args) {
    return new Promise((resolve) => {
        let allStdout = '';
        const child = spawn('docker', args, { stdio: ["inherit", undefined, "inherit"] });

        child.on('error', _ => process.exit(1));
        child.stdout.on('data', chunk => {
          process.stdout.write(chunk);
          allStdout += chunk.toString()
        });
        child.on('close', (code, signal) => resolve({ code, signal, allStdout }));
    });
}

const runStart = async () => {
  const status = await runCommand([
    "run", "--rm", "-d", "-it", "--name", "gitlab-ce", "gitlab/gitlab-ce:latest"
    // "-d",
    // "-p",
    // "8080:80",
    // "--name",
    // "server",
    // "nginx",
  ]);
  console.log(status)
  if (status.code === DOCKER_STATUS_CONTAINER_ALREADY_EXISTS) {
    await runCommand(["start", "gitlab-ce"]);
  }
};

const runStop = async () => {
  console.log("rm", await runCommand(["rm", "-f", "gitlab-ce"]));
};

const runRestart = async () => {
  await runStop();
  await runStart();
};

const runPassword = async () => {
  const { code, allStdout } = await runCommand(["exec", "gitlab-ce", "grep", "Password:", "/etc/gitlab/initial_root_password"]);
  if (code === 0) {
    console.log("output", allStdout.split(":")[1].trim());
  } else {
    console.error('Could not find password');
  }
}

const complete = async () => {
  await runStart();
  await sleep(10*1000)
  await runPassword();
  await runStop();
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

switch (command) {
  case "start":
    await runStart();
    break;
  case "stop":
    await runStop();
    break;
  case "restart":
    await runRestart();
    break;
  case "password":
    await runPassword();
    break;
  case "complete":
    await complete();
    break;
  default:
    console.log("unknown command");
}
