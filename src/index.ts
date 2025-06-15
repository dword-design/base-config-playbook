import packageName from 'depcheck-package-name';
import endent from 'endent';
import loadPkg from 'load-pkg';

export default function () {
  const packageConfig = loadPkg.sync(this.cwd);
  return {
    allowedMatches: ['index.yml', 'templates'],
    isLockFileFixCommitType: true,
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
          run: endent`
            python -m pip install --upgrade pip
            pip install ansible
          `,
        },
        {
          uses: 'webfactory/ssh-agent@v0.5.1',
          with: { 'ssh-private-key': '${{ secrets.SSH_PRIVATE_KEY }}' },
        },
        {
          run: 'ssh-keyscan -H ${{ secrets.SERVER_IP }} >> ~/.ssh/known_hosts',
        },
        {
          run: `"${endent`
            [servers]
            \${{ secrets.SERVER_IP }} ansible_user=\${{ secrets.SERVER_USER }} ansible_become=True}
          `}" > .inventory`,
        },
      ],
    }),
  };
}
