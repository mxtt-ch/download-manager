import * as React from "react";
import "./table.less";

/**
 * 表格容器组件
 */
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={["table", className].filter(Boolean).join(" ")}
      {...props}
    />
  </div>
));
Table.displayName = "Table";

/**
 * 表头容器
 */
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={["table-header", className].filter(Boolean).join(" ")}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

/**
 * 表体容器
 */
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={["table-body", className].filter(Boolean).join(" ")}
    {...props}
  />
));
TableBody.displayName = "TableBody";

/**
 * 表格行动态样式
 */
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={["table-row", className].filter(Boolean).join(" ")}
    {...props}
  />
));
TableRow.displayName = "TableRow";

/**
 * 表头单元格
 */
const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={["table-head", className].filter(Boolean).join(" ")}
    {...props}
  />
));
TableHead.displayName = "TableHead";

/**
 * 表格数据单元格
 */
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={["table-cell", className].filter(Boolean).join(" ")}
    {...props}
  />
));
TableCell.displayName = "TableCell";

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
};
