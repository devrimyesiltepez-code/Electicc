using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using Autodesk.AutoCAD.ApplicationServices;
using Autodesk.AutoCAD.DatabaseServices;
using Autodesk.AutoCAD.EditorInput;
using Autodesk.AutoCAD.Runtime;
using Autodesk.AutoCAD.Windows;

namespace Electicc.CadPlugin
{
    public class Commands : IExtensionApplication
    {
        private static PaletteSet? _paletteSet;
        private static PanelControl? _panelControl;

        public void Initialize()
        {
        }

        public void Terminate()
        {
        }

        [CommandMethod("ELECTICC_PANEL")]
        public void ShowPanel()
        {
            EnsurePalette();
            _paletteSet!.Visible = true;
            _paletteSet.Activate(0);
        }

        private static void EnsurePalette()
        {
            if (_paletteSet != null)
            {
                return;
            }

            _paletteSet = new PaletteSet("Electicc Plan Panel")
            {
                Style = PaletteSetStyles.ShowAutoHideButton | PaletteSetStyles.ShowCloseButton,
                MinimumSize = new Size(280, 180),
                Size = new Size(320, 220)
            };

            _panelControl = new PanelControl();
            _paletteSet.Add("Plan", _panelControl);
        }
    }

    public class PanelControl : UserControl
    {
        private readonly ComboBox _planTypeCombo;
        private readonly Button _scanButton;
        private readonly Button _applyButton;

        public PanelControl()
        {
            Dock = DockStyle.Fill;

            var layout = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 1,
                RowCount = 4,
                Padding = new Padding(8)
            };

            layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            layout.RowStyles.Add(new RowStyle(SizeType.AutoSize));
            layout.RowStyles.Add(new RowStyle(SizeType.Percent, 100));

            var planLabel = new Label
            {
                Text = "Plan türü",
                AutoSize = true,
                Margin = new Padding(0, 0, 0, 4)
            };

            _planTypeCombo = new ComboBox
            {
                DropDownStyle = ComboBoxStyle.DropDownList,
                Width = 200
            };

            _planTypeCombo.Items.AddRange(new object[]
            {
                "Elektrik",
                "Mekanik",
                "Mimari"
            });
            _planTypeCombo.SelectedIndex = 0;

            _scanButton = new Button
            {
                Text = "Tara",
                AutoSize = true,
                Margin = new Padding(0, 8, 0, 4)
            };
            _scanButton.Click += (_, _) => ScanTexts();

            _applyButton = new Button
            {
                Text = "Uygula",
                AutoSize = true,
                Margin = new Padding(0, 4, 0, 0)
            };
            _applyButton.Click += (_, _) => ShowMessage($"'{_planTypeCombo.SelectedItem}' planı uygulandı.");

            layout.Controls.Add(planLabel, 0, 0);
            layout.Controls.Add(_planTypeCombo, 0, 1);
            layout.Controls.Add(_scanButton, 0, 2);
            layout.Controls.Add(_applyButton, 0, 3);

            Controls.Add(layout);
        }

        private static void ShowMessage(string message)
        {
            var doc = Application.DocumentManager.MdiActiveDocument;
            if (doc != null)
            {
                doc.Editor.WriteMessage($"\n{message}");
            }
            else
            {
                Application.ShowAlertDialog(message);
            }
        }

        private static void ScanTexts()
        {
            var doc = Application.DocumentManager.MdiActiveDocument;
            if (doc == null)
            {
                ShowMessage("Aktif çizim bulunamadı.");
                return;
            }

            var results = new List<Room>();
            ScanDatabase(doc.Database, "Ana çizim", results);
            ScanXrefs(doc.Database, results);

            if (results.Count == 0)
            {
                doc.Editor.WriteMessage("\nTarama sonucu bulunamadı.");
                return;
            }

            doc.Editor.WriteMessage($"\nTarama sonucu: {results.Count} adet metin bulundu.");
            foreach (var hit in results)
            {
                doc.Editor.WriteMessage(
                    $"\n[{hit.Source}] \"{hit.Name}\" @ ({hit.Position.X:0.###}, {hit.Position.Y:0.###}, {hit.Position.Z:0.###})");
                Debug.WriteLine(
                    $"[{hit.Source}] \"{hit.Name}\" @ ({hit.Position.X:0.###}, {hit.Position.Y:0.###}, {hit.Position.Z:0.###})");
            }
        }

        private static void ScanXrefs(Database hostDatabase, List<Room> results)
        {
            var xrefGraph = hostDatabase.GetHostDwgXrefGraph(false);
            for (var i = 0; i < xrefGraph.NumNodes; i++)
            {
                var node = xrefGraph.GetXrefNode(i) as XrefGraphNode;
                if (node == null || !node.IsXref || node.BlockTableRecordId.IsNull || node.IsNested)
                {
                    continue;
                }

                var xrefDatabase = node.Database;
                if (xrefDatabase == null || ReferenceEquals(xrefDatabase, hostDatabase))
                {
                    continue;
                }

                var sourceName = node.Name;
                ScanDatabase(xrefDatabase, sourceName, results);
            }
        }

        private static void ScanDatabase(Database database, string sourceName, List<Room> results)
        {
            using var transaction = database.TransactionManager.StartTransaction();
            var blockTable = (BlockTable)transaction.GetObject(database.BlockTableId, OpenMode.ForRead);
            if (!blockTable.Has(BlockTableRecord.ModelSpace))
            {
                return;
            }

            var modelSpaceId = blockTable[BlockTableRecord.ModelSpace];
            var modelSpace = (BlockTableRecord)transaction.GetObject(modelSpaceId, OpenMode.ForRead);
            foreach (ObjectId entityId in modelSpace)
            {
                if (entityId.IsNull || entityId.IsErased)
                {
                    continue;
                }

                var entity = transaction.GetObject(entityId, OpenMode.ForRead, false) as Entity;
                if (entity is DBText text)
                {
                    AddHit(results, sourceName, text.TextString, text.Position);
                }
                else if (entity is MText mtext)
                {
                    AddHit(results, sourceName, mtext.Text, mtext.Location);
                }
            }

            transaction.Commit();
        }

        private static void AddHit(List<Room> results, string sourceName, string rawText, Point3d position)
        {
            var normalized = (rawText ?? string.Empty).Trim().ToUpperInvariant();
            if (string.IsNullOrWhiteSpace(normalized))
            {
                return;
            }

            results.Add(new Room(normalized, position, sourceName));
        }

        private readonly struct Room
        {
            public Room(string name, Point3d position, string source)
            {
                Name = name;
                Position = position;
                Source = source;
            }

            public string Name { get; }
            public Point3d Position { get; }
            public string Source { get; }
        }
    }
}
