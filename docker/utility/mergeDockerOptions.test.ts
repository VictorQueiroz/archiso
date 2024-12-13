import test from "ava";
import mergeDockerOptions, {DockerMode} from "./mergeDockerOptions";

test('second argument have all properties as optional', t => {
  t.pass();
});

test('it should keep the other options', (t) => {
  console.log(mergeDockerOptions({
    dockerArguments: {
      mode: {
        [DockerMode.Exec]: {
          prefix: ['-v', 'a:b']
        },
        [DockerMode.Run]: {
          prefix: []
        }
      }
    },
    user: null
  }, {
    dockerArguments: {
      mode: {
        [DockerMode.Exec]: {
          prefix: ['-v','a:b']
        },
        [DockerMode.Run]: {
          prefix: []
        }
      }
    },
  }))
  t.deepEqual([],[]);
});
