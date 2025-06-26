export class ImportSessionCommand {
  constructor(
    public readonly projectPath: string,
    public readonly recursive: boolean = true,
    public readonly force: boolean = false,
    public readonly continueOnError: boolean = true,
  ) {}
}
