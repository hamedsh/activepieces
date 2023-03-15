import { MigrationInterface, QueryRunner } from "typeorm";
import { logger } from "../../helper/logger";

export class removeCollectionVersion1678492809093 implements MigrationInterface {
    name = 'removeCollectionVersion1678492809093'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info("Running migration removeCollectionVersion1678492809093");
        await queryRunner.commitTransaction();
        await queryRunner.startTransaction();
        const collectionRepo = queryRunner.connection.getRepository("collection");
        const collections = await collectionRepo.find({});
        for (let i = 0; i < collections.length; ++i) {
            let currentCollection = collections[i];
            const [latestCollectionVersion] = await queryRunner.query(`SELECT * FROM public.collection_version WHERE "collectionId"='${currentCollection.id}' ORDER BY created DESC LIMIT 1`);
            let displayName = "Untitled";
            if (latestCollectionVersion) {
                displayName = latestCollectionVersion['displayName'];
            }
            currentCollection = {
                ...currentCollection,
                displayName: displayName
            }
            await collectionRepo.update(currentCollection.id, currentCollection);
        }
        logger.info("Finished migration removeCollectionVersion1678492809093");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "displayName"`);
        await queryRunner.query(`ALTER TABLE "flow_run" ADD "collectionVersionId" character varying(21) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "instance" ADD "collectionVersionId" character varying(21) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "instance" ADD CONSTRAINT "REL_183c020130aa172f58c6a0c647" UNIQUE ("collectionVersionId")`);
        await queryRunner.query(`ALTER TABLE "flow_run" ADD CONSTRAINT "fk_flow_run_collection_version_id" FOREIGN KEY ("collectionVersionId") REFERENCES "collection_version"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
