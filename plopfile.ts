import { Actions, NodePlopAPI } from "plop";
import { plural } from "pluralize";

export default function (plop: NodePlopAPI) {
  plop.setHelper("dbPrefix", (txt: string) => txt.toLowerCase().substring(0, 3) + "_");
  plop.setHelper("pluralize", (txt: string) => plural(txt));

  plop.setGenerator("Data Model", {
    description: "Data model logic",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "What is the name (e.g., User, Product)?",
      },
      {
        type: "confirm",
        name: "wantService",
        message: "Do you want to create a service?",
        default: true,
      },
      {
        type: "list",
        name: "serviceType",
        message: "What type of service?",
        choices: [
          { name: "Full CRUD (read + write operations)", value: "crud" },
          { name: "Read-only (list, get, count only)", value: "base" },
        ],
        default: "crud",
        when: (answers) => answers.wantService,
      },
      {
        type: "confirm",
        name: "wantController",
        message: "Do you want to create a controller?",
        default: true,
      },
    ],
    actions: (data) => {
      if (!data) {
        throw new Error("data is undefined");
      }

      const actions: Actions = [{
        type: "add",
        path: "src/models/{{lowerCase name}}/{{lowerCase name}}.ts",
        templateFile: "plop-templates/entity.hbs",
        abortOnFail: true,
      }];

      // Add the model to db.module.ts
      actions.push({
        type: "append",
        path: "src/modules/_db/db.module.ts",
        pattern: `import { TypeOrmModule } from "@nestjs/typeorm";`,
        template: `import { {{pascalCase name}} } from "@/models/{{lowerCase name}}/{{lowerCase name}}";`,
        abortOnFail: true,
      });

      actions.push({
        type: "append",
        path: "src/modules/_db/db.module.ts",
        pattern: `TypeOrmModule.forFeature([`,
        template: `      {{pascalCase name}},`,
        abortOnFail: true,
      });

      if (data.wantService) {
        const serviceTemplate = data.serviceType === "base"
          ? "plop-templates/base-service.hbs"
          : "plop-templates/crud-service.hbs";
        actions.push({
          type: "add",
          path: "src/modules/{{lowerCase name}}/{{lowerCase name}}.service.ts",
          templateFile: serviceTemplate,
          abortOnFail: true,
        });
      }

      if (data.wantController) {
        const controllerTemplate = data.serviceType === "base"
          ? "plop-templates/base-controller.hbs"
          : "plop-templates/crud-controller.hbs";
        actions.push({
          type: "add",
          path: "src/modules/{{lowerCase name}}/{{lowerCase name}}.controller.ts",
          templateFile: controllerTemplate,
          abortOnFail: true,
        });
      }

      if (data.wantService || data.wantController) {
        actions.push({
          type: "add",
          path: "src/modules/{{lowerCase name}}/{{lowerCase name}}.module.ts",
          templateFile: "plop-templates/module.hbs",
          abortOnFail: true,
        });

        // Add the module to app.module.ts
        actions.push({
          type: "append",
          path: "src/modules/app/app.module.ts",
          pattern: `import { DbModule } from "@/modules/_db/db.module";`,
          template: `import { {{pascalCase name}}Module } from "@/modules/{{lowerCase name}}/{{lowerCase name}}.module";`,
          abortOnFail: true,
        });

        actions.push({
          type: "append",
          path: "src/modules/app/app.module.ts",
          pattern: `    DbModule,`,
          template: `    {{pascalCase name}}Module,`,
          abortOnFail: true,
        });

        if (data.wantController) {
          actions.push({
            type: "append",
            path: "src/modules/{{lowerCase name}}/{{lowerCase name}}.module.ts",
            pattern: `import { TypeOrmModule } from "@nestjs/typeorm";`,
            template: `import { {{pascalCase name}}Controller } from "@/modules/{{lowerCase name}}/{{lowerCase name}}.controller";`,
            abortOnFail: true,
          });

          actions.push({
            type: "modify",
            path: "src/modules/{{lowerCase name}}/{{lowerCase name}}.module.ts",
            pattern: /(controllers:\s*\[\s*\])/g,
            template: `controllers: [{{pascalCase name}}Controller]`,
            abortOnFail: true,
          });
        }
      }

      return actions;
    },
  });
}
