// Custom Decorator for resolving dependencies
export function Inject(TargetClass: new (...args: any[]) => any) {
    return function (_: any, ctx: ClassFieldDecoratorContext) {
        if (ctx.kind !== "field") {
            throw new Error("@Inject must be used on class fields only");
        }

        ctx.addInitializer(function () {
            Object.defineProperty(this, ctx.name, {
                get: () => GameDI.get(TargetClass.name),
                enumerable: true,
                configurable: true,
            });
        });
    };
}

// Custom IoC (Inversion of Control) Container
export class GameDI {
    private static readonly _registry = new Map<string, any>();
    private static _locked = false;

    // Stores game singletons
    public static add(
        Class: new (...args: any[]) => any,
        ...params: any[]
    ): void {
        if (this._locked)
            throw new Error("Registry is locked after initialization");

        this._registry.set(Class.name, new Class(...params));
    }

    // Fetches stored instances by class name
    public static get<T>(identifier: string): T {
        const instance = this._registry.get(identifier);
        if (!instance) throw new Error(`Dependency not found: ${identifier}`);

        return instance as T;
    }

    // Locks the container and runs post-construction hooks
    public static boot(): void {
        this._locked = true;

        for (const [_, instance] of this._registry) {
            if (
                "postConstruct" in instance &&
                typeof instance.postConstruct === "function"
            ) {
                instance.postConstruct();
            }
        }
    }
}
