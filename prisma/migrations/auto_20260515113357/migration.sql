-- CreateTable
CREATE TABLE "KamusItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "behavioralIndicators" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "KamusItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KamusEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "KamusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandarJabatan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandarJabatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandarJabatanKamus" (
    "id" TEXT NOT NULL,
    "standarJabatanId" TEXT NOT NULL,
    "kamusItemId" TEXT NOT NULL,
    "expectedLevel" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "StandarJabatanKamus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioKamus" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "kamusItemId" TEXT NOT NULL,

    CONSTRAINT "ScenarioKamus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KamusItem_code_key" ON "KamusItem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StandarJabatan_name_key" ON "StandarJabatan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StandarJabatanKamus_standarJabatanId_kamusItemId_key" ON "StandarJabatanKamus"("standarJabatanId", "kamusItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Scenario_name_key" ON "Scenario"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioKamus_scenarioId_kamusItemId_key" ON "ScenarioKamus"("scenarioId", "kamusItemId");

-- AddForeignKey
ALTER TABLE "StandarJabatanKamus" ADD CONSTRAINT "StandarJabatanKamus_standarJabatanId_fkey" FOREIGN KEY ("standarJabatanId") REFERENCES "StandarJabatan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandarJabatanKamus" ADD CONSTRAINT "StandarJabatanKamus_kamusItemId_fkey" FOREIGN KEY ("kamusItemId") REFERENCES "KamusItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioKamus" ADD CONSTRAINT "ScenarioKamus_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioKamus" ADD CONSTRAINT "ScenarioKamus_kamusItemId_fkey" FOREIGN KEY ("kamusItemId") REFERENCES "KamusItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

