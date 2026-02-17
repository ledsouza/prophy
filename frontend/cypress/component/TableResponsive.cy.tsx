import Table from "@/components/common/Table";

type Row = {
    id: number;
    name: string;
    city: string;
    status: string;
};

describe("Table (responsive)", () => {
    const rows: Row[] = [
        { id: 1, name: "Cliente A", city: "São Paulo", status: "Ativo" },
        { id: 2, name: "Cliente B", city: "Rio de Janeiro", status: "Inativo" },
    ];

    beforeEach(() => {
        cy.viewport(390, 844);
    });

    it("keeps horizontal scrolling inside the table container", () => {
        cy.mount(
            <Table<Row>
                data={rows}
                keyExtractor={(row) => row.id}
                columns={[
                    { header: "Nome", cell: (row) => row.name, width: "180px" },
                    { header: "Cidade", cell: (row) => row.city, width: "180px" },
                    { header: "Status", cell: (row) => row.status, width: "180px" },
                ]}
            />,
        );

        cy.window().then((win) => {
            const root = win.document.documentElement;
            expect(root.scrollWidth).to.be.at.most(root.clientWidth);
        });
    });
});
