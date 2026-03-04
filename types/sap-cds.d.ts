declare module '@sap/cds' {
  interface CdsEnvironment {
    requires?: Record<string, { kind?: string }>;
  }

  interface CdsConnect {
    to(serviceName: string): Promise<any>;
  }

  interface Cds {
    env: CdsEnvironment;
    connect: CdsConnect;
  }

  const cds: Cds;
  export default cds;
}
