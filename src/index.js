import dedent from 'dedent';
import packageName from 'depcheck-package-name';
import loadPkg from 'load-pkg';

export default () => {
  const packageConfig = loadPkg.sync();
  return {
    npmPublish: false,
    ...(!packageConfig.private && {
      deployPlugins: [
        [
          packageName`@semantic-release/exec`,
          { publishCmd: 'ansible-playbook index.yml -i .inventory' },
        ],
      ],
      preDeploySteps: [
        {
          name: 'Install Python',
          uses: 'actions/setup-python@v4',
          with: { 'python-version': '3.x' },
        },
        {
          name: 'Install ansible',
          run: dedent`
              python -m pip install --upgrade pip
              pip install ansible
            `,
        },
        {
          uses: 'webfactory/ssh-agent@v0.5.1',
          with: { 'ssh-private-key': '${{ secrets.SSH_PRIVATE_KEY }}' },
        },
        { run: 'ssh-keyscan -H ${{ SERVER_IP }} >> ~/.ssh/known_hosts' },
        {
          run: `"${dedent`
              [servers]
              \${{ secrets.SERVER_IP }} ansible_user=\${{ secrets.SERVER_USER }} ansible_become=True}
            `}" > .inventory`,
        },
      ],
    }),
  };
};
