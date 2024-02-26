import { CommonModule } from '@angular/common';
import { Component, Input, Output, OnInit, EventEmitter, ViewChildren, QueryList, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Block, Project, ProjectUser } from '../../models/me';
import { VerticalSliderComponent } from '../vertical-slider/vertical-slider.component';

@Component({
  selector: 'app-block',
  standalone: true,
  imports: [CommonModule, VerticalSliderComponent],
  templateUrl: './block.component.html',
  styleUrl: './block.component.css'
})
export class BlockComponent implements OnInit {

  @Input() block!: Block;
  @Input() projects?: ProjectUser[];
  @Output() completionStatus: EventEmitter<boolean> = new EventEmitter<boolean>();
  activeProjectIndex: number | null = null;
  xp: number = 0;
  completed_projects: ProjectUser[] = [];
  completed: boolean = false;
  completed_project_number: number = 0;
  planned_projects: ProjectUser[] = [];
  slider_mark: number = 100;
  show_slider:boolean = false;
  // estimatedXP: number = 0;


  constructor(private changeDetectorRef: ChangeDetectorRef) {
  }


  get estimatedXP(): number {
    return this.planned_projects.reduce((acc, project) => acc + project.occurrence, 0);
  }

  isCompleted($event: Project) {
    return this.completed_projects.find((project: ProjectUser) => {
      return project.project.id == $event.id;
    });
  }

  isBlockCompleted() {
    this.completed = this.estimatedXP >= this.block.min_xp && this.completed_project_number >= this.block.min_projects;
    this.completionStatus.emit(this.completed);
    return this.completed;
  }

  planProject(project: Project): void {
    if (!this.isCompleted(project) && !this.isPlanned(project)) {
      this.planned_projects.push({ id: project.id, xp: project.xp , name: project.name, slug: project.slug, occurrence: project.xp * 1,
       final_mark: 100, status: "", "validated?": true, current_team_id: 0, project: project, cursus_ids: [21] } as ProjectUser);
      this.completed_project_number++;

    } else if (this.isPlanned(project)) {
      this.planned_projects = this.planned_projects.filter((projectUser: ProjectUser) => {
        projectUser.id != project.id;
      });
      this.completed_project_number--;
    }
    this.isBlockCompleted();
    this.show_slider = false;

  }
  isPlanned(project: Project): boolean {
    return this.planned_projects.find((projectUser: ProjectUser) => {
      return projectUser.project.id == project.id;
    }) ? true : false;
  }

  ngOnInit() {
    if (this.projects) {

      console.log(this.projects);
      this.completed_projects = this.projects.filter((project: ProjectUser) => {
        if (this.block.projects.find(p => {
          if (p.id == project.project.id) {
            console.log(p.xp * project.final_mark / 100);
            this.xp += p.xp * project.final_mark / 100;
            this.xp = Math.round(this.xp);
            return true;
          }
          return false;
        })) {
          return true;
        }
        return false;
      }
      );
    }
    this.completed_project_number = this.completed_projects.length;
    // this.estimatedXP = this.xp;
    this.isBlockCompleted();
  }

  toggleSlider(event: MouseEvent, index: number) {
    event.stopPropagation();
    this.show_slider = !this.show_slider;
    console.log(this.show_slider)
    this.activeProjectIndex = this.activeProjectIndex === index ? null : index;
    this.changeDetectorRef.detectChanges(); // Manually trigger change detection
  }


  event($event:any){
    this.show_slider = true;
    $event.preventDefault();
    $event.stopPropagation();
  }

  setPlannedXP(project: Project, $event: any){
    // project: planned project. event, estimated note (percentage of the base note)
    console.log($event.target.value);
    const mark = $event.target.value;
    this.slider_mark = mark;
    const new_xp = Math.round(project.xp * mark / 100);
    let found :ProjectUser | undefined = this.planned_projects.find((projectUser: ProjectUser) => {
      if (projectUser.project.id == project.id) {
        projectUser.final_mark = mark;
        projectUser.occurrence = new_xp;
        return true;
      }
      return false;
    });
    if (!found) {
      this.planned_projects.push({ id: project.id, xp: project.xp , name: project.name, slug: project.slug, occurrence: new_xp, final_mark: mark, status: "", "validated?": true, current_team_id: 0, project: project, cursus_ids: [21] } as ProjectUser);
    }
  }

  getPlannedXP(project: Project): number {
    let mark = 0;
    let found :ProjectUser | undefined = this.planned_projects.find((projectUser: ProjectUser) => {
      if (projectUser.project.id == project.id) {
        return true;
      }
      return false;
    });
    if (found) {
      return found.occurrence;
    }
    if (this.completed_projects.find((projectUser: ProjectUser) => {
      if (projectUser.project.id == project.id) {
        mark = projectUser.final_mark;
        return true;
      }
      return false;
    } )) {
      return Math.round(project.xp * mark / 100);
    }
    return 0;
  }
}
